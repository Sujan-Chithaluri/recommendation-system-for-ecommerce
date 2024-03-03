import React, { useCallback, useEffect } from "react";

import { useState } from "react";
import { getYourOrders } from "../api/ApiService";
import { useLoading } from "../Context/LoadingContext";
import ProductCards from "../Components/Products/ProductCards";
import { useAuth } from "../Context/AuthContext";
import { Pagination } from "react-bootstrap";

const Orders = () => {
  const pageLimit = 6;
  const { userDetails } = useAuth();
  const { setSpinner } = useLoading();

  const [totalPages, setTotalPages] = useState();
  const [currentPage, setCurrentPage] = useState(0);
  const [products, setProducts] = useState([]);

  const getResultsFromRDS = useCallback((data) => {
    (async () => {
      try {
        setSpinner(true);
        let response = await getYourOrders(...data);

        if (response.data) {
          setProducts(response.data.products);
          setTotalPages(Math.floor(response.data.recordsFiltered / pageLimit));
        }
        setSpinner(false);
      } catch (error) {
        setSpinner(false);
        console.log("Something went wrong", error);
      }
    })();
  }, []);

  useEffect(() => {
    getResultsFromRDS([
      userDetails.customer_id,
      pageLimit,
      pageLimit * currentPage,
      "",
    ]);
  }, []);

  useEffect(() => {
    getResultsFromRDS([
      userDetails.customer_id,
      pageLimit,
      pageLimit * currentPage,
      "",
    ]);
  }, [currentPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <div className="container-fluid py-5">
        <div className="container">
          <div className="d-flex flex-column justify-content-between">
            <div className="border-start border-5 border-primary ps-5 mb-5">
              <h6 className="text-primary text-uppercase">Previous Orders</h6>
              <h1 className="display-5 text-uppercase mb-0">Your Orders</h1>
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

          <div className="row justify-content-center">
            <Pagination className="mt-5">
              <Pagination.First
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() =>
                  currentPage > 1 && handlePageChange(currentPage - 1)
                }
                disabled={currentPage === 1}
              />
              <Pagination.Item>{1}</Pagination.Item>

              {totalPages > 2 && <Pagination.Ellipsis />}

              {currentPage > 2 && currentPage < totalPages && (
                <>
                  <Pagination.Item
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    {currentPage - 1}
                  </Pagination.Item>
                  <Pagination.Item
                    onClick={() => handlePageChange(currentPage)}
                    active={true}
                  >
                    {currentPage}
                  </Pagination.Item>
                  <Pagination.Item
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    {currentPage + 1}
                  </Pagination.Item>{" "}
                  <Pagination.Ellipsis />
                </>
              )}

              <Pagination.Item>{totalPages}</Pagination.Item>

              <Pagination.Next
                onClick={() =>
                  currentPage < totalPages && handlePageChange(currentPage + 1)
                }
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        </div>
      </div>
    </>
  );
};

export default Orders;
