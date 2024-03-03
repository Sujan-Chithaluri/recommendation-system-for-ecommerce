import React from "react";

const OrderItems = (props) => {
  return (
    <>
      {props.orderItems.map((item, i) => {
        return (
          <div key={i.toString()}>
            <div
              className="d-flex flex-row justify-content-start mb-2"
              key={i.toString()}
            >
              <div className="col-12 col-sm-3 d-flex justify-content-start">
                <small className="text-titlecase">{item.name}</small>
              </div>
              <div className="col-12 col-sm-4 d-flex justify-content-start">
                <small className="text-titlecase">
                  ${item.price} X {item.count}
                </small>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default OrderItems;
