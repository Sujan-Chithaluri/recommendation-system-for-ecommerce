import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import {
  addToCart,
  getcartProducts,
  processUserAction,
} from "../api/ApiService";
import { useLoading } from "./LoadingContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isLoggedIn, userDetails } = useAuth();
  const { setSpinner } = useLoading();

  const [cartItems, setCartItems] = useState([]);

  const fetchCart = useCallback(async () => {
    try {
      let response = await getcartProducts(
        ...[userDetails.customer_id, 100, 0, ""]
      );

      console.log("response", response.data.products);

      if (response.data) {
        setCartItems(response.data.products);
      }
    } catch (error) {
      console.log("Something went wrong", error);
    }
  }, [userDetails]);

  useEffect(() => {
    if (isLoggedIn) fetchCart();
  }, [fetchCart, isLoggedIn]);

  const getItemCount = useCallback(
    (itemId) => {
      const foundItem = cartItems.find((item) => item.product_id === itemId);
      return foundItem ? foundItem.quantity : 0;
    },
    [cartItems]
  );

  const getItemUUID = useCallback(
    (itemId) => {
      const foundItem = cartItems.find((item) => item.product_id === itemId);
      console.log(itemId, "foundItem", foundItem);
      console.log(itemId, "cartItems", cartItems);

      return foundItem ? foundItem.uuid : null;
    },
    [cartItems]
  );

  const addItem = useCallback(
    (product) => {
      (async () => {
        try {
          const obj = {
            customer_id: userDetails.customer_id,
            product_id: product.id,
            quantity: 1,
          };

          console.log(product.id, "obj", obj);

          await addToCart(obj);
          await fetchCart();

          const req_body = {
            customer_id: userDetails.customer_id,
            product_id: product.id,
            product_category: product.category,
            product_health_index: product.health_index,
            activity_type: "added_to_wish_list",
          };

          await processUserAction(req_body);
        } catch (error) {
          setSpinner(false);
          console.log("Something went wrong", error);
        }
      })();
    },
    [userDetails, setSpinner, fetchCart]
  );

  const incrementAddedItem = useCallback(
    (itemId) => {
      (async () => {
        try {
          const value = getItemCount(itemId);
          const obj = {
            customer_id: userDetails.customer_id,
            uuid: getItemUUID(itemId),
            quantity: value + 1,
          };

          console.log(itemId, value, "obj", obj);

          await addToCart(obj);

          setCartItems((prevItems) =>
            prevItems.map((item) =>
              item.product_id === itemId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          );
        } catch (error) {
          setSpinner(false);
          console.log("Something went wrong", error);
        }
      })();
    },
    [userDetails, setSpinner, getItemCount, getItemUUID]
  );

  const decrementAddedItem = useCallback(
    (itemId) => {
      (async () => {
        const value = getItemCount(itemId);
        try {
          const obj = {
            customer_id: userDetails.customer_id,
            uuid: getItemUUID(itemId),
            quantity: value - 1,
          };

          await addToCart(obj);

          setCartItems((prevItems) =>
            prevItems
              .map((item) =>
                item.product_id === itemId
                  ? { ...item, quantity: Math.max(item.quantity - 1, 0) }
                  : item
              )
              .filter((item) => item.quantity > 0)
          );
        } catch (error) {
          setSpinner(false);
          console.log("Something went wrong", error);
        }
      })();
    },
    [userDetails, setSpinner, getItemCount, getItemUUID]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItem,
        incrementAddedItem,
        decrementAddedItem,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
