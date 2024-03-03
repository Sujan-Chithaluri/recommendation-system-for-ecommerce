import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { loginUser } from "../api/ApiService";
import { useState } from "react";
import { Alert } from "react-bootstrap";
import { useAuth } from "../Context/AuthContext";
import LoadingSpinner from "../Components/LoadingSpinner";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formValues = {};

    formData.forEach((value, key) => {
      formValues[key] = value;
    });

    try {
      setIsLoading(true);
      let authentication = await loginUser(formValues);
      setIsLoading(false);

      if (authentication.data) {
        login(authentication.data);
        navigate("/home");
      }
    } catch (error) {
      setIsLoading(false);

      setError(
        "An error occurred during login. Please try with valid credentials."
      );
    }
  };

  return (
    <>
      <LoadingSpinner isLoading={isLoading} />

      <div className="container py-5" style={{ width: "700px" }}>
        <div className="row g-5">
          <div className="col-lg-8"></div>

          <div className="bg-light rounded p-5">
            <h3 className="text-uppercase border-start border-5 border-primary ps-3 mb-4">
              Login
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12">
                  <input
                    type="email"
                    name="username"
                    className="form-control bg-white border-0"
                    placeholder="Your Email"
                    style={{ height: "55px" }}
                    required
                  />
                </div>
                <div className="col-12">
                  <input
                    type="password"
                    name="password"
                    className="form-control bg-white border-0"
                    placeholder="Password"
                    style={{ height: "55px" }}
                    required
                  />
                </div>

                <div className="col-12">
                  <button className="btn btn-primary w-100 py-3" type="submit">
                    Login
                  </button>
                </div>

                {/* <div className="col-12 d-flex flex-row justify-content-between">
                  <Link
                    className="text-primary text-titlecase ms-5"
                    to="/register"
                  >
                    Don't have an account?
                  </Link>
                  <Link
                    className="text-primary text-titlecase me-5"
                    to="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div> */}
              </div>
            </form>

            {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
