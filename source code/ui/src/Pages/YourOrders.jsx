import React, { useState, useEffect } from "react";

import OrderItems from "../Components/Orders/OrderItems";
import { getAllOrdersForUser } from "../api/ApiService";
import { useAuth } from "../Context/AuthContext";
import LoadingSpinner from "../Components/LoadingSpinner";

const YourOrders = () => {
  const { userDetails } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const orders = await getAllOrdersForUser(userDetails.id);
      setOrders(orders.data.reverse());
      setIsLoading(false);
    })();
  }, [userDetails.id]);

  const calculateCartTotalValue = (orderItems) => {
    return orderItems.reduce((total, item) => {
      const itemCount = parseInt(item.count, 10);
      const itemPrice = parseInt(item.price, 10);
      const itemTotalValue = itemCount * itemPrice;
      return total + itemTotalValue;
    }, 0);
  };

  const calculateCartTotalItems = (orderItems) => {
    return orderItems.reduce((totalItems, item) => {
      const itemCount = parseInt(item.count, 10);
      return totalItems + itemCount;
    }, 0);
  };

  return (
    <>
      <LoadingSpinner isLoading={isLoading} />

      <div className="container py-5" style={{ width: "80%" }}>
        <div className="border-start border-5 border-primary ps-5 mb-5">
          <h6 className="text-primary text-uppercase">Orders</h6>
          <h1 className="display-5 text-uppercase mb-0">
            Products you ordered
          </h1>
        </div>
        <div className="d-flex flex-column justify-content-center">
          {orders.length > 0 ? (
            <>
              <div className="accordion mb-3" id="eachOrder">
                {orders.map((item, i) => {
                  return (
                    <div key={i.toString()}>
                      <div className="accordion-item mt-3" key={i.toString()}>
                        <div className="accordion-header" id={`heading-${i}`}>
                          <button
                            className="accordion-button"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#collapse-${i}`}
                            aria-expanded="true"
                            aria-controls={`collapse-${i}`}
                          >
                            <i className="bi bi-calendar-date me-2"></i>
                            {item.delivery.deliveryDate}
                            <div>
                              <small className="ms-3">
                                {calculateCartTotalItems(item.orderItem)} items
                              </small>
                              <small className="ms-3">
                                Total Price : $
                                {calculateCartTotalValue(item.orderItem)}
                              </small>
                            </div>
                          </button>
                        </div>
                        <div
                          id={`collapse-${i}`}
                          className="accordion-collapse collapse show"
                          aria-labelledby={`heading-${i}`}
                          data-bs-parent="#eachOrder"
                        >
                          <div className="accordion-body">
                            <div className="mb-3">
                              <small>
                                <i className="bi bi-geo-alt me-2"></i>
                                {item.delivery.deliveryType === "0"
                                  ? "Curbside Pickup : "
                                  : "Home Delivery : "}
                                {item.delivery.address}
                              </small>
                            </div>

                            <OrderItems orderItems={item.orderItem} />

                            <div className="mt-3">
                              <small>
                                Payment :
                                <i className="bi bi-credit-card ms-3 me-2"></i>
                                {item.cardNumber}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <span className="fs-3 fw-light">Not ordered yet</span>
          )}
        </div>
      </div>
    </>
  );
};

export default YourOrders;
