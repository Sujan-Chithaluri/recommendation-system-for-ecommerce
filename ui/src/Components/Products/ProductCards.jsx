import React, { useCallback } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useCart } from "../../Context/CartContext";
import { useAuth } from "../../Context/AuthContext";
import { useLoading } from "../../Context/LoadingContext";
import {
  addToWishlist,
  likeTheProduct,
  processUserAction,
  saveProductForLater,
} from "../../api/ApiService";
import { useNavigate } from "react-router-dom";

const ProductCards = (props) => {
  const { addItem, getItemCount, incrementAddedItem, decrementAddedItem } =
    useCart();

  const { isLoggedIn, userDetails } = useAuth();
  const { setSpinner } = useLoading();
  const navigate = useNavigate();

  const handleLikeButton = useCallback(
    (product) => {
      (async () => {
        try {
          setSpinner(true);
          const req_body = {
            customer_id: userDetails.customer_id,
            product_id: product.id,
          };

          likeTheProduct(req_body);

          req_body["product_category"] = product.category;
          req_body["product_health_index"] = product.health_index;
          req_body["activity_type"] = "liked";

          processUserAction(req_body);
          setSpinner(false);
        } catch (error) {
          setSpinner(false);
          console.log("Something went wrong", error);
        }
      })();
    },
    [userDetails, setSpinner]
  );

  const handleSaveForLaterButton = useCallback(
    (product) => {
      (async () => {
        try {
          setSpinner(true);
          const req_body = {
            customer_id: userDetails.customer_id,
            product_id: product.id,
          };

          saveProductForLater(req_body);

          req_body["product_category"] = product.category;
          req_body["product_health_index"] = product.health_index;
          req_body["activity_type"] = "saved_for_later";

          processUserAction(req_body);
          setSpinner(false);
        } catch (error) {
          setSpinner(false);
          console.log("Something went wrong", error);
        }
      })();
    },
    [userDetails, setSpinner]
  );

  const handleWishListButton = useCallback(
    (product) => {
      (async () => {
        try {
          setSpinner(true);
          const req_body = {
            customer_id: userDetails.customer_id,
            product_id: product.id,
          };

          addToWishlist(req_body);

          req_body["product_category"] = product.category;
          req_body["product_health_index"] = product.health_index;
          req_body["activity_type"] = "added_to_wish_list";

          processUserAction(req_body);
          setSpinner(false);
        } catch (error) {
          setSpinner(false);
          console.log("Something went wrong", error);
        }
      })();
    },
    [userDetails, setSpinner]
  );

  return (
    <>
      <Card style={{ width: "25rem" }} className="m-3 p-0" id={props.id}>
        <Card.Img
          variant="top"
          src={props.image}
          style={{ objectFit: "cover", maxHeight: "250px" }}
        />
        <Card.Header className="text-center">
          <OverlayTrigger placement="top" overlay={<Tooltip>Like</Tooltip>}>
            <Button
              variant="primary"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
              }}
              onClick={() => {
                console.log("isLoggedIn", isLoggedIn);
                if (isLoggedIn) handleLikeButton(props);
                else navigate("/login");
              }}
            >
              <i className="bi bi-hand-thumbs-up text-primary"></i>
            </Button>
          </OverlayTrigger>

          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Save for Later</Tooltip>}
          >
            <Button
              variant="primary"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
              }}
              onClick={() => {
                if (isLoggedIn) handleSaveForLaterButton(props);
                else navigate("/login");
              }}
            >
              <i className="bi bi-bookmarks text-primary"></i>
            </Button>
          </OverlayTrigger>

          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Add to Wishlist</Tooltip>}
          >
            <Button
              variant="primary"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
              }}
              onClick={() => {
                if (isLoggedIn) handleWishListButton(props);
                else navigate("/login");
              }}
            >
              <i className="bi bi-heart text-primary"></i>
            </Button>
          </OverlayTrigger>
        </Card.Header>
        <Card.Body className="d-flex flex-column justify-content-center align-items-center">
          <Card.Title className="text-center text-capitalize">
            {props.name}
          </Card.Title>
          <Card.Text>{props.desc}</Card.Text>

          <span className="py-2">$ {props.price}</span>
        </Card.Body>
        <Card.Footer className="text-center">
          {getItemCount(props.id) === 0 ? (
            <Button
              variant="primary col-6 m-2"
              onClick={() => {
                if (isLoggedIn) addItem(props);
                else navigate("/login");
              }}
            >
              Add to cart <i className="bi bi-cart ms-2" />
            </Button>
          ) : (
            <div className="d-flex flex-row justify-content-center align-items-center">
              <Button
                variant="primary"
                className="m-2"
                onClick={() => incrementAddedItem(props.id)}
              >
                +
              </Button>

              <h4 className="text-center mb-0">{getItemCount(props.id)}</h4>

              <Button
                variant="primary"
                className="m-2"
                onClick={() => decrementAddedItem(props.id)}
              >
                -
              </Button>
            </div>
          )}
        </Card.Footer>
      </Card>
    </>
  );
};

export default ProductCards;
