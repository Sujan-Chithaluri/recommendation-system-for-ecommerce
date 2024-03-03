import React from "react";
import { useAuth } from "../../Context/AuthContext";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

export const NavbarComponent = () => {
  const { isLoggedIn, logout } = useAuth();

  return (
    <>
      <Navbar collapseOnSelect expand="lg" className="navbar-dark bg-dark">
        <Container fluid>
          <Navbar.Brand href="/" className="ms-lg-5">
            <h1 className="m-0 text-titlecase">
              <i className="bi bi-cart4 me-3"></i>Smart Basket
            </h1>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto"></Nav>
            <Nav>
              <Nav.Link href="/home">Home</Nav.Link>
              <Nav.Link href="/products">Products</Nav.Link>

              {isLoggedIn && (
                <>
                  <Nav.Link href="/recommendations">Recommendatations</Nav.Link>
                  <Nav.Link href="/cart">Cart</Nav.Link>
                </>
              )}

              {!isLoggedIn && (
                <>
                  <Nav.Link href="/login">Login</Nav.Link>
                </>
              )}

              {isLoggedIn && (
                <NavDropdown
                  title={<i className="bi bi-person-circle"></i>}
                  id="collapsible-nav-dropdown"
                  align="end"
                >
                  <NavDropdown.Item href="/liked">Liked</NavDropdown.Item>
                  <NavDropdown.Item href="/saved">Saved</NavDropdown.Item>
                  <NavDropdown.Item href="/wishlist">Wishlist</NavDropdown.Item>
                  <NavDropdown.Item href="/orders">
                    Your Orders
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item
                    href="/login"
                    onClick={() => {
                      logout();
                    }}
                  >
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default NavbarComponent;
