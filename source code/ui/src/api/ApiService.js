import axios from "axios";

const ip = "54.163.22.125";

export const loginUser = async (user) =>
  await axios.post(`http://${ip}/login`, user);

export const registerUser = async (user) =>
  await axios.post(`http://${ip}/registerUser`, user);

export const getProducts = async (limit, offset, searchValue) =>
  await axios.get(
    `http://${ip}/products?limit=${limit}&offset=${offset}&searchValue=${searchValue}`
  );

export const getRecommendations = async (customer_id) =>
  await axios.get(
    `http://${ip}/get_recommendations?customer_id=${customer_id}`
  );

export const getLikedProducts = async (
  customer_id,
  limit,
  offset,
  searchValue
) =>
  await axios.get(
    `http://${ip}/likedProducts?customer_id=${customer_id}&limit=${limit}&offset=${offset}&searchValue=${searchValue}`
  );

export const getSavedProducts = async (
  customer_id,
  limit,
  offset,
  searchValue
) =>
  await axios.get(
    `http://${ip}/savedProducts?customer_id=${customer_id}&limit=${limit}&offset=${offset}&searchValue=${searchValue}`
  );

export const getWishlistProducts = async (
  customer_id,
  limit,
  offset,
  searchValue
) =>
  await axios.get(
    `http://${ip}/wishlist?customer_id=${customer_id}&limit=${limit}&offset=${offset}&searchValue=${searchValue}`
  );

export const getcartProducts = async (
  customer_id,
  limit,
  offset,
  searchValue
) =>
  await axios.get(
    `http://${ip}/cart?customer_id=${customer_id}&limit=${limit}&offset=${offset}&searchValue=${searchValue}`
  );

export const getYourOrders = async (customer_id, limit, offset, searchValue) =>
  await axios.get(
    `http://${ip}/orders?customer_id=${customer_id}&limit=${limit}&offset=${offset}&searchValue=${searchValue}`
  );

export const addToCart = async (req) => {
  await axios.post(`http://${ip}/addToCart`, req);
};

export const likeTheProduct = async (req) => {
  await axios.post(`http://${ip}/likeProduct`, req);
};

export const addToWishlist = async (req) => {
  await axios.post(`http://${ip}/addToWishlist`, req);
};

export const saveProductForLater = async (req) => {
  await axios.post(`http://${ip}/saveProductForLater`, req);
};

export const processUserAction = async (req) => {
  await axios.post(`http://${ip}/processUserAction`, req);
};

export const saveCart = async (req) => {
  await axios.post(`http://${ip}/processUserAction`, req);
};

export const getCart = async (req) => {
  await axios.post(`http://${ip}/processUserAction`, req);
};
