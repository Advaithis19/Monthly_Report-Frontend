import React, { useState, useEffect, useRef } from "react";
import useAxios from "../../utils/axios";
import Form from "./form";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { getTalkInstance } from "../../services/talks";
import { getUsers } from "../../services/users";
import { trackPromise } from "react-promise-tracker";

const EditTalk = () => {
  const initialFormData = Object.freeze({
    topic: "",
    venue: "",
    n_stud: "",
    n_fac: "",
    n_ind: "",
    f_id: "",
  });

  const [formData, updateFormData] = useState(initialFormData);
  const [date, setDate] = useState(new Date());

  let api = useAxios();
  api.defaults.xsrfCookieName = "csrftoken";
  api.defaults.xsrfHeaderName = "X-CSRFToken";

  const navigate = useNavigate();
  const { id } = useParams();
  const [users, setUsers] = useState([]);
  const usersRef = useRef();

  useEffect(() => {
    let mounted = true;
    trackPromise(
      getUsers(api)
        .then((response) => {
          if (mounted) {
            usersRef.current = response.data.map((user) => {
              return {
                label: user.first_name + " " + user.last_name,
                value: user.id,
              };
            });
            setUsers(usersRef.current);
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
    trackPromise(
      getTalkInstance(api, id)
        .then((res) => {
          if (mounted) {
            updateFormData({
              ...formData,
              ["topic"]: res.data.topic,
              ["venue"]: res.data.venue,
              ["n_stud"]: res.data.n_stud,
              ["n_fac"]: res.data.n_fac,
              ["n_ind"]: res.data.n_ind,
              ["f_id"]: findMatchingUser(res.data.f_id, usersRef.current),
            });
            setDate(dayjs(res.data.date));
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
  }, [setUsers, updateFormData]);

  const findMatchingUser = (userInstance, userResponseArray) => {
    return userResponseArray.filter((userResponseInstance) => {
      return userInstance === userResponseInstance.label;
    })[0].value;
  };

  const onSubmit = async (e) => {
    let postData = new FormData();
    postData.append("topic", formData.topic);
    postData.append("venue", formData.venue);
    postData.append("n_stud", formData.n_stud);
    postData.append("n_fac", formData.n_fac);
    postData.append("n_ind", formData.n_ind);
    postData.append("date", dayjs(date).format("YYYY-MM-DD"));
    postData.append("f_id", formData.f_id);

    api
      .put(`talks/edit/` + id + "/", postData)
      .then(() => {
        navigate("/talks/" + id);
        // window.location.reload();
      })
      .catch((error) => {
        if (error.response.status === 401) {
          alert("Authentication has expired! Please re-login");
          navigate("/logout");
        } else if (error.response.status === 403) {
          alert("You do not have permission to perform this action!");
          navigate("/talks/" + id);
        } else {
          alert("Error! Please check the values entered for any mistakes....");
        }
      });
  };

  return (
    <Form
      formData={formData}
      updateFormData={updateFormData}
      date={date}
      setDate={setDate}
      users={users}
      onSubmit={onSubmit}
      type="Edit"
    />
  );
};

export default EditTalk;
