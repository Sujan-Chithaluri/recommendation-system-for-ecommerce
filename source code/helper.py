import pandas as pd
from sagemaker.feature_store.feature_group import FeatureGroup
import time
import boto3
import sagemaker
from sagemaker.serializers import JSONSerializer
import os
import json
from sagemaker.session import Session

# Session variables
boto_session = boto3.Session()
region = boto_session.region_name
sagemaker_client = boto_session.client(service_name="sagemaker", region_name=region)
featurestore_runtime = boto_session.client(
    service_name="sagemaker-featurestore-runtime", region_name=region
)
account_id = boto3.client("sts").get_caller_identity()["Account"]
feature_store_session = Session(
    boto_session=boto_session,
    sagemaker_client=sagemaker_client,
    sagemaker_featurestore_runtime_client=featurestore_runtime,
)


class FMSerializer(JSONSerializer):
    def serialize(self, data):
        js = {"instances": []}
        for row in data:
            js["instances"].append({"features": row.tolist()})
        return json.dumps(js)


def query_offline_store(
    feature_group_name, query, sagemaker_session, query_output_s3_uri=None, wait=True
):

    feature_group = FeatureGroup(
        name=feature_group_name, sagemaker_session=sagemaker_session
    )
    feature_group_athena_query = feature_group.athena_query()
    if not query_output_s3_uri:
        query_output_s3_uri = f"s3://{sagemaker_session.default_bucket()}/query_results"
    try:
        feature_group_athena_query.run(
            query_string=query, output_location=query_output_s3_uri
        )
        if wait:
            feature_group_athena_query.wait()
            return feature_group_athena_query.as_dataframe(), feature_group_athena_query
        else:
            return None, None
    except Exception as e:
        print(e)
        print(
            f'\nNote that the "{feature_group.name}" Feature Group is a table called "{feature_group_athena_query.table_name}" in Athena.'
        )


def await_feature_group_creation(feature_group):
    status = feature_group.describe().get("FeatureGroupStatus")
    print(f"Initial status: {status}")
    while status == "Creating":
        print(f"Waiting for feature group: {feature_group.name} to be created ...")
        time.sleep(5)
        status = feature_group.describe().get("FeatureGroupStatus")
    if status != "Created":
        raise SystemExit(
            f"Failed to create feature group {feature_group.name}: {status}"
        )
    print(f"FeatureGroup {feature_group.name} was successfully created.")


def get_feature_definitions(df, feature_group):
    
    feature_definitions = []
    feature_definitions = feature_group.load_feature_definitions(data_frame=df)
    return feature_definitions


def create_feature_group(
    df, feature_group_name, record_id, s3_prefix, sagemaker_session
):
    current_time_sec = int(round(time.time()))
    df["event_time"] = pd.Series([current_time_sec] * len(df), dtype="float64")

    # If the df doesn't have an id column, add it
    if record_id not in df.columns:
        df[record_id] = df.index

    feature_group = FeatureGroup(
        name=feature_group_name, sagemaker_session=sagemaker_session
    )

    feature_definitions = get_feature_definitions(df, feature_group)
    feature_group.feature_definitions = feature_definitions

    try:
        feature_group.create(
            s3_uri=f"s3://{sagemaker_session.default_bucket()}/{s3_prefix}",
            record_identifier_name=record_id,
            event_time_feature_name="event_time",
            role_arn=sagemaker.get_execution_role(),
            enable_online_store=True,
        )
        await_feature_group_creation(feature_group)
    except Exception as e:
        code = e.response["Error"]["Code"]
        if code == "ResourceInUse":
            print(f"Using existing feature group: {feature_group.name}")
        else:
            raise (e)
    return feature_group


def _get_offline_details(fg_name, sagemaker_session, s3_uri=None):
    _data_catalog_config = sagemaker_session.sagemaker_client.describe_feature_group(
        FeatureGroupName=fg_name
    )["OfflineStoreConfig"]["DataCatalogConfig"]
    _table = _data_catalog_config["TableName"]
    _database = _data_catalog_config["Database"]

    if s3_uri is None:
        s3_uri = f"s3://{sagemaker_session.default_bucket()}/offline-store"
    _tmp_uri = f"{s3_uri}/query_results/"
    return _table, _database, _tmp_uri


def _run_query(query_string, temp_uri, database, region):

    athena = boto3.client("athena")
    s3_client = boto3.client("s3", region_name=region)

    query_execution = athena.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={"Database": database},
        ResultConfiguration={"OutputLocation": temp_uri},
    )

    query_execution_id = query_execution["QueryExecutionId"]
    query_state = athena.get_query_execution(QueryExecutionId=query_execution_id)[
        "QueryExecution"
    ]["Status"]["State"]
    while query_state != "SUCCEEDED" and query_state != "FAILED":
        time.sleep(2)
        query_state = athena.get_query_execution(QueryExecutionId=query_execution_id)[
            "QueryExecution"
        ]["Status"]["State"]

    if query_state == "FAILED":
        print(athena.get_query_execution(QueryExecutionId=query_execution_id))
        failure_reason = athena.get_query_execution(
            QueryExecutionId=query_execution_id
        )["QueryExecution"]["Status"]["StateChangeReason"]
        print(failure_reason)
        df = pd.DataFrame()
        return df
    else:
        results_file_prefix = f"offline-store/query_results/{query_execution_id}.csv"
        filename = "query_results.csv"
        results_bucket = (temp_uri.split("//")[1]).split("/")[0]
        s3_client.download_file(results_bucket, results_file_prefix, filename)
        df = pd.read_csv("query_results.csv")
        os.remove("query_results.csv")

        s3_client.delete_object(Bucket=results_bucket, Key=results_file_prefix)
        s3_client.delete_object(
            Bucket=results_bucket, Key=results_file_prefix + ".metadata"
        )
        return df


def get_historical_record_count(fg_name, sagemaker_session, s3_uri=None):
    tableName, dbName, temp_uri = _get_offline_details(
        fg_name, sagemaker_session, s3_uri
    )
    _query_string = f'SELECT COUNT(*) FROM "' + tableName + f'"'
    _tmp_df = _run_query(
        _query_string,
        temp_uri,
        dbName,
        sagemaker_session.boto_region_name,
        verbose=False,
    )
    return _tmp_df.iat[0, 0]


def wait_for_offline_data(feature_group_name, df, sagemaker_session):
    df_count = df.shape[0]
    offline_store_contents = None
    while offline_store_contents is None:
        fg_record_count = get_historical_record_count(
            feature_group_name, sagemaker_session
        )
        if fg_record_count >= df_count:
            print(
                f"Features are available in the offline store for {feature_group_name}!"
            )
            offline_store_contents = fg_record_count
        else:
            print("Waiting for data in offline store...")
            time.sleep(60)
