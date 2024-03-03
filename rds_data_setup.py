import pandas as pd
import mysql.connector as mysql

def connectMySQL(hostName, userName, password):
    try:
        return mysql.connect(host=hostName, port=3306, user=userName, passwd=password, buffered=True)
    except Exception as e:
        print("Error occured while connection: ", e)

db = connectMySQL('database-1.cuvic0eospxx.us-west-2.rds.amazonaws.com','admin','AZaz09$$')

descriptions = {
    "cookies_cakes" : "Satisfy your sweet tooth with our delectable assortment of cookies and cakes. From classic chocolate chip cookies to indulgent layer cakes, find the perfect treat for any occasion",
    "energy_granola_bars" : "Fuel your day with our energy-packed granola bars. Packed with wholesome ingredients like oats, nuts, and dried fruits, these bars provide a convenient and nutritious on-the-go snack.",
    "juice_nectars" :"Quench your thirst with our refreshing selection of juices and nectars. From freshly squeezed citrus juices to exotic fruit nectars, discover a variety of flavors to brighten your day.",
    "coffee" :"Elevate your mornings with our premium coffee collection. Explore a rich array of coffee beans, from bold espresso blends to smooth single-origin options, for a perfect brew every time.",
    "packaged_cheese": "Delight in the savory goodness of our packaged cheese selection. From creamy brie to sharp cheddar, enhance your culinary creations with a diverse range of cheese varieties.",
    "refrigerated":"Explore our refrigerated section for fresh and perishable goods. From dairy essentials like milk and eggs to ready-to-eat meals, find everything you need to keep your fridge stocked.",
    "candy_chocolate":"Indulge your sweet cravings with our tempting assortment of candies and chocolates. From classic favorites to gourmet delights, treat yourself to a world of confectionery delights.",
    "chips_pretzels":"Snack time just got better with our selection of chips and pretzels. Crispy, crunchy, and oh-so-satisfying, these snacks are perfect for munching on any occasion.",
    "vitamins_supplements":"Nourish your body with our vitamins and supplements. Whether you're looking for essential vitamins, minerals, or specialized supplements, prioritize your well-being with our health-focused products.",
    "ice_cream_ice":"Beat the heat with our indulgent ice cream and ice offerings. From classic vanilla to exotic flavors, our frozen treats are perfect for creating sweet moments all year round.",
    "soup_broth_bouillon":"Warm up your day with our comforting selection of soups, broths, and bouillons. From hearty stews to soothing chicken broth, find a variety of options to suit your taste.",
    "hair_care":"Elevate your self-care routine with our premium hair care products. From nourishing shampoos to styling essentials, discover products that will leave your hair looking and feeling fabulous.",
    "yogurt":"Cultivate a healthy lifestyle with our diverse range of yogurts. From Greek yogurt to dairy-free alternatives, find the perfect balance of flavor and nutrition in every spoonful.",
    "baby_food_formula":"Nurture your little ones with our thoughtfully curated selection of baby food and formula. Specially crafted to meet the nutritional needs of growing infants, our products provide wholesome nourishment.",
    "spices_seasonings":"Transform your culinary creations with our premium spices and seasonings. Explore a world of flavors, from exotic spices to versatile seasoning blends, and add a dash of excitement to your dishes.",
    "frozen_meals":"Enjoy convenient and delicious meals with our frozen meal options. From quick bites to gourmet entrees, our frozen selection caters to a variety of tastes and preferences.",
    "tea":"Unwind and savor the moment with our diverse tea collection. From soothing herbal blends to energizing black teas, discover the perfect cup to suit your mood and preferences.",
    "cleaning_products":"Keep your home sparkling clean with our reliable cleaning products. From multi-surface cleaners to eco-friendly options, maintain a pristine living space effortlessly.",
    "baking_ingredients":"Elevate your baking endeavors with our high-quality baking ingredients. From premium flours to decadent chocolates, find everything you need to create delightful treats in your own kitchen.",
    "crackers":"Elevate your snacking experience with our assortment of crackers. From classic saltines to gourmet options, our crackers are the perfect accompaniment to your favorite cheeses and spreads.",
}

df_customers = pd.read_csv('customers.csv')
df_products = pd.read_csv('products.csv')
df_orders = pd.read_csv('orders.csv')

from random import randint
df_customers['username'] = df_customers['customer_id'].apply(lambda x: x + "@cougarnet.uh.edu")
df_customers['password'] = df_customers['customer_id'].apply(lambda x: x)
df_products['product_price'] = df_products['product_health_index'].apply(lambda x: randint(5,20))
df_products['product_description'] = df_products['product_category'].apply(lambda x: descriptions[x])
df_products['product_image'] = df_products['product_category'].apply(lambda x: f"https://clickstream-analytics-project.s3.amazonaws.com/cs-images/{x}/{x}_{randint(0,5)}.jpg")
customer_rows = list(df_customers.itertuples(index=False,name=None))
products_rows = list(df_products.itertuples(index=False,name=None))
orders_rows = list(df_orders.itertuples(index=False,name=None))

cursor = db.cursor(dictionary=True)
cursor.executemany("""INSERT INTO cs_project.product(`product_name`,`product_category`,`product_id`,`product_health_index`, `product_price`,`product_description`, `product_image`) VALUES(%s,%s,%s,%s,%s,%s,%s)""",products_rows)
db.commit()
cursor.executemany("""INSERT INTO cs_project.customer(`customer_id`,`name`,`state`,`age`,`is_married`,`customer_health_index`, `username`, `pass`) VALUES(%s,%s,%s,%s,%s,%s, %s, %s)""",customer_rows)
db.commit()
cursor.executemany("""INSERT INTO cs_project.order(`customer_id`,`product_id`,`purchase_amount`) VALUES(%s,%s,%s)""",orders_rows)
db.commit()
cursor.close()
db.close()