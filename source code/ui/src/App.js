import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar/Navbar";
import Home from "./Pages/Home";
import Product from "./Pages/Product";
import Cart from "./Pages/Cart";
import Login from "./Pages/Login";
import Register from "./Pages/Register";

import { useAuth } from "./Context/AuthContext";
import Layout from "./Components/Layout";
import Recommendations from "./Pages/Recommendations";
import Saved from "./Pages/Saved";
import Liked from "./Pages/Liked";
import Wishlist from "./Pages/Wishlist";
import Orders from "./Pages/Orders";

function App() {
  const { isLoggedIn } = useAuth();

  return (
    <div>
      <BrowserRouter>
        <Layout>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/home" element={<Home />} />
            <Route path="/products" element={<Product />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {isLoggedIn ? (
              <>
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/liked" element={<Liked />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/orders" element={<Orders />} />
              </>
            ) : (
              <>
                <Route path="/recommendations" element={<Login />} />
                <Route path="/cart" element={<Login />} />
                <Route path="/saved" element={<Login />} />
                <Route path="/liked" element={<Login />} />
                <Route path="/wishlist" element={<Login />} />
                <Route path="/orders" element={<Login />} />
              </>
            )}

            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
