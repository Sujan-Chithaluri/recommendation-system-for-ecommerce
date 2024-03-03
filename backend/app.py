import os
import json
import math
from datetime import datetime, timedelta
import csv, time
import pandas as pd
import numpy as np
import boto3
import hashlib
import mysql.connector as mysql
from sagemaker.feature_store.feature_group import FeatureGroup
import sagemaker
from sagemaker.serializers import JSONSerializer
from sagemaker.serializers import CSVSerializer
from sagemaker.deserializers import JSONDeserializer
from scipy.sparse import hstack
from sklearn.preprocessing import OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from flask import Flask, request
from flask_cors import CORS
customers_feature_group_name = 'clickstreamrec-customers-fg-12-07-00-51'
products_feature_group_name = 'clickstreamrec-products-fg-12-07-00-51'
click_stream_feature_group_name = 'clickstreamrec-click-stream-fg-12-07-00-51'
customers_table="clickstreamrec_customers_fg_12_07_00_51_1701910310"
products_table="clickstreamrec_products_fg_12_07_00_51_1701910332"
click_stream_historical_table="clickstreamrec_click_stream_historical_fg_12_07_00_51_1701910411"
collabfilter_model_endpoint_name="clickstreamrec-collabfilter-model-12-07-01-18"
ranking_model_endpoint_name="clickstreamrec-ranking-model-12-07-01-18"
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
def connectMySQL(hostName, userName, password):
    try:
        return mysql.connect(host=hostName, port=3306, user=userName, passwd=password, buffered=True)
    except Exception as e:
        print("Error occured while connection: ", e)

db = connectMySQL('database-1.cuvic0eospxx.us-west-2.rds.amazonaws.com','admin','AZaz09$$')

class FMSerializer(JSONSerializer):
    def serialize(self, data):
        js = {"instances": []}
        for row in data:
            js["instances"].append({"features": row.tolist()})
        return json.dumps(js)
    
app = Flask(__name__)
CORS(app)

def create_uuid(customer_id, product_id):
    now = datetime.now()
    formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
    temp = customer_id + product_id + formatted_date
    hashed_string = hashlib.sha256(temp.encode('utf-8')).hexdigest()
    return hashed_string

@app.route('/login', methods=['POST'])
def authenticate_customers():
    body = request.json
    username, password = body['username'], body['password']
    mycursor = db.cursor(dictionary=True)
    db.ping(reconnect=True)
    query = '''
    select *
    from cs_project.customer where username = %s
    '''
    mycursor.execute(query,(username,))
    myresult = mycursor.fetchone()
    if myresult['pass'] == password:
        mycursor.close()
        return myresult, 200
    else:
        mycursor.close()
        return { "message" : "Invalid login credentials"}, 401

@app.route('/products', methods=['GET'])
def get_products():
    limit = request.args.get('limit')
    offset = request.args.get('offset')
    searchValue = request.args.get("searchValue")
    searchValue = "%" + searchValue.lower() + "%"
    mycursor = db.cursor(dictionary=True)
    db.ping(reconnect=True)
    query = '''
        select *
        from cs_project.product where (LOWER(product_name) like %s or LOWER(product_category) like %s) 
        order by product_name 
        limit %s offset %s
        '''
    mycursor.execute(query, (searchValue, searchValue, int(limit), int(offset)))
    rv = mycursor.fetchall()
    mycursor.execute("SELECT COUNT(*) as recordsFiltered FROM cs_project.product p where (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s)",(searchValue, searchValue, ))
    recordsFiltered = mycursor.fetchone()
    mycursor.close()
    return { "products":rv, "recordsFiltered" : recordsFiltered["recordsFiltered"]},200
    
@app.route('/cart', methods=['GET'])
def get_cart_by_customer():
    limit = request.args.get('limit')
    offset = request.args.get('offset')
    customer_id = request.args.get('customer_id')
    searchValue = request.args.get("searchValue")
    searchValue = "%" + searchValue.lower() + "%"
    db.ping(reconnect=True)
    query = '''
            select p.product_name, p.product_category, uc.customer_id, uc.uuid,uc.quantity, p.product_health_index, uc.event_time, p.product_description, p.product_price, p.product_image, uc.product_id
            from cs_project.cart uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s) limit %s offset %s'''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query, (customer_id,searchValue, searchValue, int(limit), int(offset)))
    rv = mycursor.fetchall()
    
    mycursor.execute("SELECT COUNT(*) as recordsFiltered from cs_project.cart uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s)",(customer_id,searchValue, searchValue,))
    recordsFiltered = mycursor.fetchone()
    mycursor.close()
    return { "products":rv, "recordsFiltered" : recordsFiltered["recordsFiltered"]},200



@app.route('/orders', methods=['GET'])
def get_orders_by_customer():
    limit = request.args.get('limit')
    offset = request.args.get('offset')
    customer_id = request.args.get('customer_id')
    searchValue = request.args.get("searchValue")
    searchValue = "%" + searchValue.lower() + "%"
    db.ping(reconnect=True)
    query = '''
            select p.product_name, p.product_category, uc.customer_id, p.product_health_index, uc.purchase_amount, p.product_description, p.product_price, p.product_image, uc.product_id
            from cs_project.order uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s) limit %s offset %s'''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query, (customer_id,searchValue, searchValue, int(limit), int(offset)))
    rv = mycursor.fetchall()
    mycursor.execute("SELECT COUNT(*) as recordsFiltered from cs_project.order uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s)",(customer_id,searchValue, searchValue,))
    recordsFiltered = mycursor.fetchone()
    mycursor.close()
    return { "products":rv, "recordsFiltered" : recordsFiltered["recordsFiltered"]},200



@app.route('/likedProducts', methods=['GET'])
def get_liked_products():
    limit = request.args.get('limit')
    offset = request.args.get('offset')
    customer_id = request.args.get('customer_id')
    searchValue = request.args.get("searchValue")
    searchValue = "%" + searchValue.lower() + "%"
    db.ping(reconnect=True)
    query = '''
            select p.product_name, p.product_category, uc.customer_id, uc.uuid, p.product_health_index, uc.event_time, p.product_description, p.product_price, p.product_image, uc.product_id
            from cs_project.liked_product uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s) limit %s offset %s'''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query,(customer_id,searchValue, searchValue, int(limit), int(offset)))
    rv = mycursor.fetchall()
    mycursor.execute("SELECT COUNT(*) as recordsFiltered from cs_project.liked_product uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s)",(customer_id,searchValue, searchValue,))
    recordsFiltered = mycursor.fetchone()
    mycursor.close()
    results = []
    return { "products":rv, "recordsFiltered" : recordsFiltered["recordsFiltered"]},200

@app.route('/wishlist', methods=['GET'])
def get_wishlist_products():
    limit = request.args.get('limit')
    offset = request.args.get('offset')
    customer_id = request.args.get('customer_id')
    searchValue = request.args.get("searchValue")
    searchValue = "%" + searchValue.lower() + "%"
    db.ping(reconnect=True)
    query = '''
            select p.product_name, p.product_category, uc.customer_id, uc.uuid, p.product_health_index, uc.event_time, p.product_description, p.product_price, p.product_image , uc.product_id
            from cs_project.wish_list_product uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s) limit %s offset %s'''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query,(customer_id, searchValue, searchValue,int(limit), int(offset)))
    rv = mycursor.fetchall()
    mycursor.execute("SELECT COUNT(*) as recordsFiltered from cs_project.wish_list_product uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s)",(customer_id,searchValue, searchValue,))
    recordsFiltered = mycursor.fetchone()
    mycursor.close()
    return { "products":rv, "recordsFiltered" : recordsFiltered["recordsFiltered"]},200

@app.route('/savedProducts', methods=['GET'])
def get_saved_products():
    limit = request.args.get('limit')
    offset = request.args.get('offset')
    customer_id = request.args.get('customer_id')
    searchValue = request.args.get("searchValue")
    searchValue = "%" + searchValue.lower() + "%"
    db.ping(reconnect=True)
    query = '''
            select p.product_name, p.product_category, uc.customer_id, uc.uuid,p.product_health_index, uc.event_time, p.product_description, p.product_price, p.product_image , uc.product_id
            from cs_project.saved_product uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s) limit %s offset %s'''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query,(customer_id, searchValue, searchValue, int(limit), int(offset)))
    rv = mycursor.fetchall()
    mycursor.execute("SELECT COUNT(*) as recordsFiltered from cs_project.saved_product uc inner join cs_project.product p on uc.product_id = p.product_id where customer_id = %s and (LOWER(p.product_name) like %s or LOWER(p.product_category) like %s)",(customer_id,searchValue,searchValue,))
    recordsFiltered = mycursor.fetchone()
    mycursor.close()
    return { "products":rv, "recordsFiltered" : recordsFiltered["recordsFiltered"]},200

@app.route('/cart', methods=['DELETE'])
def remove_cart():
    request_body = request.json
    customer_id = request_body['customer_id']
    query = '''
        DELETE FROM cs_project.cart where customer_id = %s
        '''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query, (customer_id,))
    mycursor.close()
    db.commit()
    return {"message" : " Cart deleted"}, 200

@app.route('/addToCart', methods=['POST'])
def save_cart():
    request_body = request.json
    customer_id = request_body['customer_id']
    quantity = request_body['quantity']
    if 'uuid' in request_body and quantity > 0:
        uuid = request_body['uuid']
        query = '''UPDATE cs_project.cart SET quantity = %s where uuid = %s and customer_id = %s'''
        mycursor = db.cursor(dictionary=True)
        mycursor.execute(query, (int(quantity),uuid, customer_id))
        mycursor.close()
        db.commit()
        return {"message" : "Product removed from cart"}, 200
    if quantity <= 0:
        uuid =  request_body['uuid']
        query = '''
        DELETE FROM cs_project.cart where uuid = %s and customer_id = %s
        '''
        mycursor = db.cursor(dictionary=True)
        mycursor.execute(query, (uuid, customer_id))
        mycursor.close()
        db.commit()
        return {"message" : "Product removed from cart"}, 200
    now = datetime.now()
    product_id = request_body['product_id']
    formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
    uuid = create_uuid(customer_id, product_id)
    query = '''
        INSERT INTO cs_project.cart(`uuid`,`customer_id`, `product_id`, `quantity`, `event_time`) values(%s, %s, %s, %s, %s)
        '''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query, (uuid, customer_id, product_id, int(quantity), formatted_date))
    mycursor.close()
    db.commit()
    return {"message" : "Product added to cart"}, 200

@app.route('/likeProduct', methods=['POST'])
def like_product():
    request_body = request.json
    customer_id = request_body['customer_id']
    product_id = request_body['product_id']
    now = datetime.now()
    formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
    db.ping(reconnect=True)
    uuid = create_uuid(customer_id, product_id)
    query = '''
        INSERT INTO cs_project.liked_product (`uuid`,`customer_id`, `product_id`, `event_time`) values(%s, %s, %s, %s)
        '''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query, (uuid, customer_id, product_id, formatted_date))
    db.commit()
    mycursor.close()
    return {"message" : "Product added to liked products"}, 200

@app.route('/addToWishlist', methods=['POST'])
def add_product_to_wish_list():
    request_body = request.json
    customer_id = request_body['customer_id']
    product_id = request_body['product_id']
    now = datetime.now()
    formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
    uuid = create_uuid(customer_id, product_id)
    query = '''
        INSERT INTO cs_project.wish_list_product (`uuid`,`customer_id`, `product_id`, `event_time`) values(%s, %s, %s, %s)
        '''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query, (uuid, customer_id, product_id, formatted_date))
    db.commit()
    mycursor.close()
    return {"message" : "Product added to wishlist"}, 200

@app.route('/saveProductForLater', methods=['POST'])
def save_product_for_later():
    request_body = request.json
    customer_id = request_body['customer_id']
    product_id = request_body['product_id']
    now = datetime.now()
    formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
    uuid = create_uuid(customer_id, product_id)
    query = '''
        INSERT INTO cs_project.saved_product (`uuid`,`customer_id`, `product_id`, `event_time`) values(%s, %s, %s, %s)
        '''
    mycursor = db.cursor(dictionary=True)
    mycursor.execute(query, (uuid, customer_id, product_id, formatted_date))
    db.commit()
    mycursor.close()
    return {"message": "Saved product for later"}, 200

@app.route('/processUserAction', methods=['POST'])
def process_user_action():
    request_body = request.json
    product_id = request_body['product_id']
    product_category = request_body['product_category']
    customer_id = request_body['customer_id']
    activity_type = request_body['activity_type']
    product_health_index = request_body['product_health_index']

    activities = ['liked', 'added_to_cart', 'added_to_wish_list', 'saved_for_later']
    if activity_type not in activities:
        return {"messgae":"Bad activity"}, 400
    
    activity_weights_dict = {'liked': 1, 'added_to_cart': 2,
                            'added_to_wish_list': 1, 'saved_for_later': 2}

    event_time = datetime.utcnow() - timedelta(seconds=10)
    data = {
        'event_time': event_time.isoformat(),
        'customer_id': customer_id,
        'product_id': product_id,
        'product_category': product_category,
        'activity_type': activity_type,
        'activity_weight': activity_weights_dict[activity_type],
        'product_health_index': product_health_index
    }
    kinesis_client = boto3.client('kinesis')
    response = kinesis_client.put_record(
            StreamName="fs-click-stream-activity",
            Data=json.dumps(data),
            PartitionKey="partitionkey")
    return {"response" : response}, 200

def get_product_categories():
    mycursor = db.cursor()
    query = f'''
            select distinct product_category
            from cs_project.product
            order by product_category 
            '''
    mycursor.execute(query)
    myresult = mycursor.fetchall()
    mycursor.close()
    return myresult

def query_offline_featurestore(
    featureGroupName, query, sagemaker_session, query_output_s3_uri=None, wait=True
):

    feature_group = FeatureGroup(
        name=featureGroupName, sagemaker_session=sagemaker_session
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

def get_ranking_model_input_data(sagemaker_session, df, df_one_hot_cat_features):
    region = sagemaker_session.boto_region_name
    featurestore_runtime = boto3.Session().client(service_name='sagemaker-featurestore-runtime',
                                    region_name=region)
    product_category_list = []
    product_health_index_list = []
    
    customer_id = df.iloc[0]['customer_id']
    # Get customer features from customers_feature_group_name
    customer_record = featurestore_runtime.get_record(FeatureGroupName=customers_feature_group_name,
                                                      RecordIdentifierValueAsString=customer_id,
                                                      FeatureNames=['customer_health_index'])
    
    customer_health_index = customer_record['Record'][0]['ValueAsString']
    
    # Get product features (instead of looping, you can optionally use
    # the `batch_get_record` Feature Store API)
    for index, row_tuple in df.iterrows():
        
        product_id = row_tuple['product_id']
        
        # Get product features from products_feature_group_name
        product_record = featurestore_runtime.get_record(FeatureGroupName=products_feature_group_name,
                                                         RecordIdentifierValueAsString=product_id,
                                                         FeatureNames=['product_category',
                                                                       'product_health_index'])
        
        product_category = product_record['Record'][0]['ValueAsString']
        product_health_index = product_record['Record'][1]['ValueAsString']
        
        product_category_list.append(product_category)
        product_health_index_list.append(product_health_index)

        

    # Get click stream features from customers_click_stream_feature_group_name
    click_stream_record = featurestore_runtime.get_record(FeatureGroupName=click_stream_feature_group_name,
                                                          RecordIdentifierValueAsString=customer_id,
                                                          FeatureNames=['sum_activity_weight_last_2m',
                                                                  'avg_product_health_index_last_2m'])
    
    # Calculate healthy_activity_last_2m as this will influence ranking as well
    sum_activity_weight_last_2m = click_stream_record['Record'][0]['ValueAsString']
    avg_product_health_index_last_2m = click_stream_record['Record'][1]['ValueAsString']
    healthy_activity_last_2m = int(sum_activity_weight_last_2m) * float(avg_product_health_index_last_2m)

    data = {'healthy_activity_last_2m': healthy_activity_last_2m,
            'product_health_index': product_health_index_list,
            'customer_health_index': customer_health_index,
            'product_category': product_category_list}
    
    ranking_inference_df = pd.DataFrame(data)
    ranking_inference_df = ranking_inference_df.merge(df_one_hot_cat_features, on='product_category',
                                                      how='left')
    del ranking_inference_df['product_category']

    return ranking_inference_df

def top_rated_products_by_customer_state(sagemaker_session, df_cf_features, customer_id, top_n):
    region = sagemaker_session.boto_region_name
    featurestore_runtime = boto3.client(service_name='sagemaker-featurestore-runtime',
                                    region_name=region)
    record = featurestore_runtime.get_record(FeatureGroupName=customers_feature_group_name,
                                             RecordIdentifierValueAsString=customer_id,
                                             FeatureNames=['state', 'is_married', 'age'])
    # Parse through record features
    other_customer_features = {}
    for feature in record['Record']:
        other_customer_features[feature['FeatureName']] = feature['ValueAsString']
        
    # Get state
    state = other_customer_features['state']
    # Filter DF by state
    df_cf_features_by_state = df_cf_features[df_cf_features['state'] == state]
    
    # Get top rated products by customer's state
    popular_items = df_cf_features_by_state.groupby(["product_id", "product_name"])['rating'].agg('mean').sort_values(ascending=False).reset_index()
    for k, v in other_customer_features.items():
        popular_items[k] = v
    popular_items['customer_id'] = customer_id
    top_n_popular_items = popular_items.iloc[0:top_n]
    top_n_popular_items = top_n_popular_items[df_cf_features.columns]
    del top_n_popular_items['rating']
    return top_n_popular_items

def transform_cf_data(training_df, inference_df=None):
    enc = OneHotEncoder(handle_unknown='ignore')
    vectorizer = TfidfVectorizer(min_df=2)
    
    onehot_cols = ['product_id', 'customer_id', 'is_married',
                   'state']
    
    if inference_df is not None:
        enc.fit(training_df[onehot_cols])
        onehot_output = enc.transform(inference_df[onehot_cols])
        unique_descriptions = training_df['product_name'].unique()
        vectorizer.fit(unique_descriptions)
        tfidf_output = vectorizer.transform(inference_df['product_name'])
    else:
        onehot_output = enc.fit_transform(training_df[onehot_cols])
        unique_descriptions = training_df['product_name'].unique()
        vectorizer.fit(unique_descriptions)
        tfidf_output = vectorizer.transform(training_df['product_name'])
    
    X = hstack([onehot_output, tfidf_output], format='csr', dtype='float32')
    return X

@app.route('/get_recommendations', methods=['GET'])
def get_product_recommendations():
    result_product_ids = []
    customer_id = request.args.get('customer_id')
    sagemaker_session = sagemaker.Session()
    query = f'''
            select click_stream_customers.customer_id,
                products.product_id,
                rating,
                state,
                age,
                is_married,
                product_name
            from (
                select c.customer_id,
                    cs.product_id,
                    cs.bought,
                    cs.rating,
                    c.state,
                    c.age,
                    c.is_married
                from "{click_stream_historical_table}" as cs
                left join "{customers_table}" as c
                on cs.customer_id = c.customer_id
            ) click_stream_customers
            left join
            (select * from "{products_table}") products
            on click_stream_customers.product_id = products.product_id
            where click_stream_customers.bought = 1
            '''

    df_cf_features, query = query_offline_featurestore(click_stream_feature_group_name, query,
                                                sagemaker_session)
    cf_inference_df = top_rated_products_by_customer_state(sagemaker_session, df_cf_features, customer_id, 10)
    cf_inference_payload = transform_cf_data(df_cf_features, cf_inference_df).toarray()
    cf_model_predictor = sagemaker.predictor.Predictor(endpoint_name=collabfilter_model_endpoint_name, 
                                                    sagemaker_session=sagemaker_session,
                                                    serializer=FMSerializer(),
                                                    deserializer=JSONDeserializer())
    predictions = cf_model_predictor.predict(cf_inference_payload)['predictions']
    predictions = [prediction["score"] for prediction in predictions]
    cf_inference_df['predictions'] = predictions
    cf_inference_df = cf_inference_df.sort_values(by='predictions', ascending=False).head(10).reset_index()
    ranking_model_predictor = sagemaker.predictor.Predictor(endpoint_name=ranking_model_endpoint_name, 
                                                        sagemaker_session=sagemaker_session,
                                                        serializer = CSVSerializer())
    
    df_one_hot_cat_features = pd.DataFrame(get_product_categories())
    df_one_hot_cat_features.columns = ['product_category']

    df_one_hot_cat_features = pd.concat([df_one_hot_cat_features, pd.get_dummies(df_one_hot_cat_features['product_category'], prefix='cat')],axis=1)
    try:
        ranking_inference_df = get_ranking_model_input_data(sagemaker_session, cf_inference_df, df_one_hot_cat_features)
        ranking_inference_df = ranking_inference_df.apply(lambda x: x.apply(lambda y: 1 if(type(y)==bool and y) else 0 if(type(y)==bool and not y) else y))
        ranking_inference_df['propensity_to_buy'] = [line.strip() for line in ranking_model_predictor.predict(ranking_inference_df.to_numpy()).decode('utf-8').split('\n') if line.strip()]
        personalized_recommendations = pd.concat([cf_inference_df[['customer_id', 'product_id', 'product_name']],
                                                ranking_inference_df[['propensity_to_buy']]], axis=1)
        recommendations = personalized_recommendations.sort_values(by='propensity_to_buy', ascending=False)[['product_id','product_name']].reset_index(drop=True).head(5)
        result_product_ids = recommendations['product_id'].unique().tolist()
        
    except Exception as e:
        result_product_ids = cf_inference_df['product_id'].head(5).unique().tolist()

    mycursor = db.cursor(dictionary=True)
    db.ping(reconnect=True)
    format_strings = ','.join(['%s'] * len(result_product_ids))
    mycursor.execute("select * from cs_project.product where product_id in (%s) order by product_name" % format_strings, tuple(result_product_ids))
    rv = mycursor.fetchall()
    mycursor.close()
    return { "products":rv },200

if __name__ == "__main__" :
    app.run(host='0.0.0.0')