"use client";
import React, { useState } from "react";
import Image from "next/image";
import * as Yup from "yup";
import { Resolver, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FirebaseError } from "firebase/app";
import ErrorMsg from "../common/error-msg";
import icon from "@/assets/images/icon/icon_60.svg";
import { useAuth } from "@/context/auth-context";

// form data type
type IFormData = {
  name: string;
  email: string;
  password: string;
};

// schema
const schema = Yup.object().shape({
  name: Yup.string().required().label("Name"),
  email: Yup.string().required().email().label("Email"),
  password: Yup.string().required().min(6).label("Password"),
});
// resolver
const resolver: Resolver<IFormData> = async (values) => {
  return {
    values: values.name ? values : {},
    errors: !values.name
      ? {
        name: {
          type: "required",
          message: "Name is required.",
        },
        email: {
          type: "required",
          message: "Email is required.",
        },
        password: {
          type: "required",
          message: "Password is required.",
        }
      }
      : {},
  };
};

const RegisterForm = () => {
  const [showPass, setShowPass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { register: registerUser } = useAuth();
  // react hook form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IFormData>({ resolver });
  // on submit
  const onSubmit = async (data: IFormData) => {
    setLoading(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        userType: "candidate",
      });
      toast.success("Account created successfully!");
      reset();
      router.push("/verify-email");
    } catch (error) {
      let message = "Something went wrong. Please try again.";
      if (error instanceof FirebaseError) {
        if (error.code === "auth/email-already-in-use") {
          message = "An account with this email already exists.";
        } else if (error.code === "auth/weak-password") {
          message = "Password should be at least 6 characters.";
        } else if (error.code === "auth/invalid-email") {
          message = "Please enter a valid email address.";
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-12">
          <div className="input-group-meta position-relative mb-25">
            <label>Name*</label>
            <input
              type="text"
              placeholder="James Brower"
              {...register("name", { required: `Name is required!` })}
              name="name"
            />
            <div className="help-block with-errors">
              <ErrorMsg msg={errors.name?.message!} />
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="input-group-meta position-relative mb-25">
            <label>Email*</label>
            <input
              type="email"
              placeholder="james@example.com"
              {...register("email", { required: `Email is required!` })}
              name="email"
            />
            <div className="help-block with-errors">
              <ErrorMsg msg={errors.email?.message!} />
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="input-group-meta position-relative mb-20">
            <label>Password*</label>
            <input
              type={`${showPass ? "text" : "password"}`}
              placeholder="Enter Password"
              className="pass_log_id"
              {...register("password", { required: `Password is required!` })}
              name="password"
            />
            <span
              className="placeholder_icon"
              onClick={() => setShowPass(!showPass)}
            >
              <span className={`passVicon ${showPass ? "eye-slash" : ""}`}>
                <Image src={icon} alt="pass-icon" />
              </span>
            </span>
            <div className="help-block with-errors">
              <ErrorMsg msg={errors.password?.message!} />
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="agreement-checkbox d-flex justify-content-between align-items-center">
            <div>
              <input
                type="checkbox"
                name="remember"
              />
              <label htmlFor="remember">
                By hitting the Register button, you agree to the{" "}
                <a href="#">Terms conditions</a> &{" "}
                <a href="#">Privacy Policy</a>
              </label>
            </div>
          </div>
        </div>
        <div className="col-12">
          <button
            type="submit"
            disabled={loading}
            className="btn-eleven fw-500 tran3s d-block mt-20"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default RegisterForm;
