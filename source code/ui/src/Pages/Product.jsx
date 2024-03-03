import React, { useCallback, useEffect } from "react";
import { Pagination } from "react-bootstrap";
import item_categories from "../Components/Assets/categories";
import { useLocation } from "react-router-dom";

import { useState } from "react";
import { getProducts } from "../api/ApiService";
import { useLoading } from "../Context/LoadingContext";
import ProductCards from "../Components/Products/ProductCards";

const Product = () => {
  const pageLimit = 6;
  const location = useLocation();
  const { setSpinner } = useLoading();
  const [totalPages, setTotalPages] = useState(Math.floor(17001 / pageLimit));
  const [currentPage, setCurrentPage] = useState(5);
  const [searchValue, setSearchValue] = useState(
    location.state?.itemCategoryProp || item_categories[0].value
  );
  const [products, setProducts] = useState([]);

  const getProductsFromRDS = useCallback((limit, offset, searchValue) => {
    (async () => {
      try {
        setSpinner(true);
        let response = await getProducts(limit, offset, searchValue);

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

  const [itemCategory, setItemCategory] = useState(
    location.state?.itemCategoryProp || item_categories[0].value
  );

  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setSearchValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      getProductsFromRDS(pageLimit, pageLimit * (currentPage - 1), searchValue);
    }
  };

  const handleItemChange = (event) => {
    getProductsFromRDS(
      pageLimit,
      pageLimit * (currentPage - 1),
      event.target.value
    );
    setItemCategory(event.target.value);
    setSearchValue(event.target.value);
  };

  const handlePageChange = (pageNumber) => {
    getProductsFromRDS(pageLimit, pageLimit * (pageNumber - 1), searchValue);
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    getProductsFromRDS(pageLimit, pageLimit * (currentPage - 1), searchValue);
  }, []);

  return (
    <>
      <div className="container-fluid py-5">
        <div className="container">
          <div className="d-flex flex-column justify-content-between">
            <div className="border-start border-5 border-primary ps-5 mb-5">
              <h6 className="text-primary text-uppercase">Products</h6>
              <h1 className="display-5 text-uppercase mb-0">
                Shop the best products
              </h1>
            </div>
          </div>

          <div className="d-flex justify-content-center mb-5 col-12">
            <div className="p-3 col-3 text-center">
              <span className="text-primary text-titlecase">
                Category Selection
              </span>

              <select
                id="dropdown"
                value={itemCategory}
                onChange={handleItemChange}
                className="form-select"
              >
                {item_categories.map((option) => (
                  <option key={option.id} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 col-3 text-center">
              <span className="text-primary text-titlecase">
                Search Products
              </span>
              <input
                type="text"
                className="form-control bg-white"
                placeholder=""
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
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
                  quantity={item.quantity}
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

              <Pagination.Ellipsis />

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

export default Product;
