import json
import base64
import subprocess
import os
import sys
from datetime import datetime
import time

import boto3

try:
    sm = boto3.Session().client(service_name="sagemaker")
    sm_fs = boto3.Session().client(service_name="sagemaker-featurestore-runtime")
except Exception as e:
    print("Unexpected error occurred:", e)

# Read Environment Vars
CUSTOMER_ACTIVITY_FEATURE_GROUP = os.environ["click_stream_feature_group_name"]


def ingest_record(
    featureGroupName, customerId, aggr_activity_weight_last2m, avg_product_health_index_last_2m
):
    record = [
        {"FeatureName": "customer_id", "ValueAsString": str(customerId)},
        {
            "FeatureName": "sum_activity_weight_last_2m",
            "ValueAsString": str(aggr_activity_weight_last2m),
        },
        {
            "FeatureName": "avg_product_health_index_last_2m",
            "ValueAsString": str(avg_product_health_index_last_2m),
        },
        {
            "FeatureName": "event_time",
            "ValueAsString": str(int(round(time.time()))),
        },
    ]
    sm_fs.put_record(FeatureGroupName=featureGroupName, Record=record)
    return


def lambda_handler(event, context):
    inv_id = context.aws_request_id
    #app_arn = event["applicationArn"]
    
    records = event["Records"]
    print(records)
    print(
        f"Received {len(records)} records, invocation id: {inv_id}"
    )

    final_records = []
    for rec in records:
        data = rec["kinesis"]["data"]
        agg_data_str = base64.b64decode(data)
        agg_data = json.loads(agg_data_str)
        print(agg_data)
        customer_id = agg_data["CUSTOMER_ID"]
        sum_activity_weight_last_2m = agg_data["SUM_ACTIVITY_WEIGHT_LAST_2M"]
        avg_product_health_index_last_2m = agg_data["AVG_PRODUCT_HEALTH_INDEX_LAST_2M"]
        print(
            f"Updating agg features for customerId: {customer_id}, Sum of activity weight last 2m: {sum_activity_weight_last_2m}, Average product health index last 2m: {avg_product_health_index_last_2m}"
        )
        ingest_record(
            CUSTOMER_ACTIVITY_FEATURE_GROUP,
            customer_id,
            sum_activity_weight_last_2m,
            avg_product_health_index_last_2m,
        )

        # Flag each record as being "Ok", so that Kinesis won't try to re-send
        final_records.append({"result": "Ok"})
    return {"records": final_records}
