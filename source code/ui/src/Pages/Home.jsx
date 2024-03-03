import React from "react";
import { useNavigate } from "react-router-dom";
import { Carousel } from "react-bootstrap";

import hero_img from "../Components/Assets/banner.jpg";

import lb from "../Components/Assets/lb-4.jpg";
import rb from "../Components/Assets/rb-1.jpg";

import banner1 from "../Components/Assets/b-1.png";

import c1 from "../Components/Assets/s-1.jpg";
import c2 from "../Components/Assets/lb-3.jpg";
import c3 from "../Components/Assets/lb-2.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <>
      <div
        className="container-fluid py-3 mb-5"
        style={{
          background: `url(${hero_img}) top right no-repeat`,
          backgroundColor: "#deedd6",
          maxHeight: "400px",
        }}
      >
        <div className="container py-5">
          <div className="row justify-content-start">
            <div className="col-lg-9 text-center text-lg-start">
              <h1 className="display-1 text-uppercase text-dark mb-lg-4">
                Smart Basket
              </h1>

              <p className="fs-4 mb-lg-4">
                A one stop destination for all products
              </p>

              <h1 className="text-titlecase mb-lg-3 my-2">
                Savor the Convenience of Online Grocery Shopping
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-center mb-5">
        <div className="col-6 mb-5">
          <Carousel style={{ maxHeight: "500px" }}>
            <Carousel.Item>
              <img
                className="d-block w-100"
                src={c1}
                alt="First slide"
                style={{ objectFit: "cover" }}
              />
              <Carousel.Caption>
                <div className="py-2 mb-5 bg-light">
                  <div>
                    <span className="text-dark">
                      Craving a crunchy delight?
                    </span>
                  </div>
                  <div>
                    <small className="text-primary">
                      Dive into our collection of savory chips and crispy
                      pretzels!
                    </small>
                  </div>

                  <button
                    className="btn btn-primary mt-2"
                    onClick={() => {
                      navigate("/products", {
                        state: { itemCategoryProp: "chips_pretzels" },
                      });
                    }}
                  >
                    Buy now
                  </button>
                </div>
              </Carousel.Caption>
            </Carousel.Item>
            <Carousel.Item>
              <img
                className="d-block w-100"
                src={c2}
                alt="Second slide"
                style={{ objectFit: "cover" }}
              />
              <Carousel.Caption>
                <div className="py-2 mb-5 bg-light">
                  <div>
                    <span className="text-dark">
                      Transform your hair care routine into a luxurious
                      experience!
                    </span>
                  </div>
                  <div>
                    <small className="text-primary">
                      Explore our premium selection of hair care products
                    </small>
                  </div>
                  <button
                    className="btn btn-primary mt-2"
                    onClick={() => {
                      navigate("/products", {
                        state: { itemCategoryProp: "hair_care" },
                      });
                    }}
                  >
                    Buy now
                  </button>
                </div>
              </Carousel.Caption>
            </Carousel.Item>
            <Carousel.Item>
              <img
                className="d-block w-100"
                src={c3}
                alt="Third slide"
                style={{ objectFit: "cover" }}
              />
              <Carousel.Caption>
                <div className="py-2 mb-5 bg-light">
                  <div>
                    <span className="text-dark">
                      Unleash your culinary creativity
                    </span>
                  </div>
                  <div>
                    <small className="text-primary">
                      Upgrade your baking game and bring out the baker in you
                      with our finest selection!
                    </small>
                  </div>
                  <button
                    className="btn btn-primary mt-2"
                    onClick={() => {
                      navigate("/products", {
                        state: { itemCategoryProp: "baking_ingredients" },
                      });
                    }}
                  >
                    Buy now
                  </button>
                </div>
              </Carousel.Caption>
            </Carousel.Item>
          </Carousel>
        </div>
      </div>

      <div className="d-flex justify-content-around mb-5">
        <img
          src={lb}
          alt=""
          className="btn"
          onClick={() => {
            navigate("/products", {
              state: { itemCategoryProp: "cookies_cakes" },
            });
          }}
        />

        <img
          src={rb}
          alt=""
          className="btn"
          onClick={() => {
            navigate("/products", {
              state: { itemCategoryProp: "candy_chocolate" },
            });
          }}
        />
      </div>
      <div className="d-flex col-12 px-5 mb-5" style={{ position: "relative" }}>
        <img
          src={banner1}
          alt=""
          style={{
            backgroundImage: `url(${banner1})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: "100%",
            position: "relative",
            cursor: "pointer",
          }}
          onClick={() => {
            navigate("/products");
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <h2 className="mb-lg-3 my-2">Whatever you want</h2>
          <p className="fs-4 mb-lg-2">
            17,000 products available to shop across the catalog
          </p>
        </div>
      </div>
    </>
  );
};

export default Hero;
