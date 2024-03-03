import React, { useCallback, useEffect } from "react";

import { useState } from "react";
import { getRecommendations } from "../api/ApiService";
import { useLoading } from "../Context/LoadingContext";
import ProductCards from "../Components/Products/ProductCards";
import { useAuth } from "../Context/AuthContext";

const Recommendations = () => {
  const { setSpinner } = useLoading();
  const { userDetails } = useAuth();

  const [products, setProducts] = useState([]);

  const getProductsFromRDS = useCallback(() => {
    (async () => {
      try {
        setSpinner(true);
        let response = await getRecommendations(userDetails.customer_id);

        if (response.data) {
          setProducts(response.data.products);
        }
        setSpinner(false);
      } catch (error) {
        setSpinner(false);
        console.log("Something went wrong", error);
      }
    })();
  }, []);

  useEffect(() => {
    getProductsFromRDS();
  }, []);

  return (
    <>
      <div className="container-fluid py-5">
        <div className="container">
          <div className="d-flex flex-column justify-content-between">
            <div className="border-start border-5 border-primary ps-5 mb-5">
              <h6 className="text-primary text-uppercase">Recommendations</h6>
              <h1 className="display-5 text-uppercase mb-0">
                Products Recommended for you
              </h1>
            </div>
          </div>

          <div className="row justify-content-center">
            {products.map((item, i) => {
              return (
                <ProductCards
                  key={i.toString()}
                  id={item.product_id}
                  name={item.product_name}
                  image={item.product_image}
                  desc={item.product_description}
                  price={item.product_price}
                  category={item.product_category}
                  health_index={item.product_health_index}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Recommendations;
