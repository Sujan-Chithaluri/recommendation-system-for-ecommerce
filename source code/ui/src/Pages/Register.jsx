import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { registerUser } from "../api/ApiService";
import { Alert } from "react-bootstrap";
import { useState } from "react";
import LoadingSpinner from "../Components/LoadingSpinner";

const Register = () => {
  const navigate = useNavigate();

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
      let authentication = await registerUser(formValues);
      setIsLoading(false);

      if (authentication.data) {
        navigate("/login");
      }
    } catch (error) {
      setIsLoading(false);
      setError("Invalid Email or Email Already Exists");
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
              Signup
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <input
                    type="text"
                    name="firstname"
                    className="form-control bg-white border-0"
                    placeholder="First Name"
                    style={{ height: "55px" }}
                    required
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <input
                    type="text"
                    name="lastname"
                    className="form-control bg-white border-0"
                    placeholder="Last Name"
                    style={{ height: "55px" }}
                    required
                  />
                </div>
                <div className="col-12">
                  <input
                    type="email"
                    name="email"
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
                    Register
                  </button>
                </div>

                <div className="col-12 ">
                  <Link className="text-primary text-titlecase" to="/login">
                    Already have an account?
                  </Link>
                </div>
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

export default Register;
