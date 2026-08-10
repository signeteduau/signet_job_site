"use client"
import React from "react";
import Link from "next/link";
import Image from "next/image";
import Menus from "./component/menus";
import logo from "@/assets/images/logo/signet-icon.png";
import useSticky from "@/hooks/use-sticky";
import { useAuth } from "@/context/auth-context";

const Header = () => {
  const {sticky} = useSticky()
  const { user, logout, homePath, profile } = useAuth();
  return (
    <>
    <header className={`theme-main-menu menu-overlay menu-style-one sticky-menu ${sticky?'fixed':''}`}>
      <div className="inner-content position-relative">
        <div className="top-header">
          <div className="d-flex align-items-center">
            <div className="logo order-lg-0">
              <Link href="/" className="d-flex align-items-center">
                <Image src={logo} alt="Signet Employment Hub" width={62} height={62} priority />
              </Link>
            </div>
            <div className="right-widget ms-auto order-lg-3">
              <ul className="d-flex align-items-center style-none">
                <li className="d-none d-md-block">
                  <Link href={user ? "/company/jobs/new" : "/register"} className="job-post-btn tran3s">
                    Post Job
                  </Link>
                </li>
                {user ? (
                  <>
                    <li className="d-none d-md-block">
                      <Link href={homePath} className="login-btn-one">
                        {profile?.fullName ||
                          profile?.companyName ||
                          user.displayName ||
                          user.email?.split("@")[0] ||
                          "Account"}
                      </Link>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="login-btn-one"
                        onClick={(e) => {
                          e.preventDefault();
                          logout();
                        }}
                      >
                        Logout
                      </a>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link href="/login" className="login-btn-one">
                      Login
                    </Link>
                  </li>
                )}
                <li className="d-none d-md-block ms-4">
                  <Link href={user ? homePath : "/register"} className="btn-one">
                    {user ? "Open app" : "Get started"}
                  </Link>
                </li>
              </ul>
            </div>
            <nav className="navbar navbar-expand-lg p0 ms-lg-5 ms-3 order-lg-2">
              <button
                className="navbar-toggler d-block d-lg-none"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav align-items-lg-center">
                  <li className="d-block d-lg-none">
                    <div className="logo">
                      <Link href="/" className="d-block">
                        <Image src={logo} alt="Signet Employment Hub" width={56} height={56} priority />
                      </Link>
                    </div>
                  </li>
                  {/* menus start */}
                  <Menus />
                  {/* menus end */}
                  <li className="d-md-none">
                    <Link href="/register" className="job-post-btn tran3s">
                      Post Job
                    </Link>
                  </li>
                  <li className="d-md-none">
                    <Link href="/login" className="btn-one w-100">
                      Get started
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
