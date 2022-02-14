import React, { useState, useEffect } from "react";
import useAxios from "../../utils/axios";
import Form from "./form";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../../services/users";
import { trackPromise } from "react-promise-tracker";
import useForm from "../../validation/lectures/useForm";
import validate from "../../validation/lectures/validateInfo";

const CreateLecture = () => {
  let api = useAxios();
  api.defaults.xsrfCookieName = "csrftoken";
  api.defaults.xsrfHeaderName = "X-CSRFToken";

  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  const submitForm = async () => {
    let postData = new FormData();
    postData.append("topic", values.topic);
    postData.append("res_person", values.res_person);
    postData.append("organisation", values.organisation);
    postData.append("n_stud", values.n_stud);
    postData.append("n_fac", values.n_fac);
    postData.append("n_ind", values.n_ind);
    postData.append("f_id", values.f_id);

    api
      .post(`lectures/create/`, postData)
      .then(() => {
        navigate("/reports/lectures/");
      })
      .catch((error) => {
        if (error.response.status === 401) {
          alert("Authentication has expired! Please re-login");
          navigate("/logout");
        } else {
          alert("Error! Please check the values entered for any mistakes....");
        }
      });
  };

  const { handleChange, handleSubmit, values, errors } = useForm(
    submitForm,
    validate
  );

  useEffect(() => {
    let mounted = true;
    trackPromise(
      getUsers(api)
        .then((response) => {
          if (mounted) {
            setUsers(
              response.data.map((user) => {
                return {
                  label: user.first_name + " " + user.last_name,
                  value: user.id,
                };
              })
            );
          }
        })
        .catch((error) => {
          if (mounted) {
            if (error.response.status === 401) {
              alert("Authentication has expired! Please re-login");
              navigate("/logout");
            } else {
              alert("Something went wrong! Please logout and try again");
            }
          }
        })
    );
    return () => {
      mounted = false;
    };
  }, [errors]);

  return (
    <Form
      values={values}
      handleChange={handleChange}
      users={users}
      handleSubmit={handleSubmit}
      errors={errors}
      type="Create"
    />
  );
};

export default CreateLecture;
