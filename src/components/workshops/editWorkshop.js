import React, { useState, useEffect, useRef } from "react";
import useAxios from "../../utils/axios";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

// Bootstrap UI
import { Form } from "react-bootstrap";

// MUI
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import DatePicker from "@mui/lab/DatePicker";

import { getWorkshopInstance } from "../../services/workshops";
import { getUsers } from "../../services/users";
import { trackPromise } from "react-promise-tracker";

//yup
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import dayjs from "dayjs";

const EditWorkshop = () => {
  const initialFormData = Object.freeze({
    event_name: "",
    venue: "",
    slug: "",
  });

  const [formData, updateFormData] = useState(initialFormData);
  const [date, setDate] = useState(new Date());
  const [facultySelected, setFacultySelected] = useState([]);

  // form validation rules
  const validationSchema = Yup.object().shape({
    event_name: Yup.string().test(
      "len",
      "Event Name is required",
      (val) => val.length > 0
    ),
    venue: Yup.string().test(
      "len",
      "Venue is required",
      (val) => val.length > 0
    ),
    // u_id: Yup.array().test(
    //   "len",
    //   "Faculty field cannot be empty",
    //   (val) => val.length > 0
    // ),
  });
  const formOptions = { resolver: yupResolver(validationSchema) };

  // get functions to build form with useForm() hook
  const { register, handleSubmit, formState } = useForm(formOptions);
  const { errors } = formState;

  let api = useAxios();
  api.defaults.xsrfCookieName = "csrftoken";
  api.defaults.xsrfHeaderName = "X-CSRFToken";

  function slugify(string) {
    const a =
      "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
    const b =
      "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------";
    const p = new RegExp(a.split("").join("|"), "g");

    return string
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, "-and-") // Replace & with 'and'
      .replace(/[^\w\-]+/g, "") // Remove all non-word characters
      .replace(/\-\-+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start of text
      .replace(/-+$/, ""); // Trim - from end of text
  }

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
                name: user.first_name + " " + user.last_name,
                id: user.id,
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
      getWorkshopInstance(api, id)
        .then((res) => {
          if (mounted) {
            updateFormData({
              ...formData,
              ["event_name"]: res.data.event_name,
              ["venue"]: res.data.venue,
              ["slug"]: res.data.slug,
            });
            setDate(dayjs(res.data.date));
            setFacultySelected(
              findMatchingUsers(res.data.u_id, usersRef.current)
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
  }, [setUsers, updateFormData, setDate, setFacultySelected]);

  const findMatchingUsers = (facultyList, userResponseArray) => {
    console.log("facultyList", facultyList);
    console.log("userResponseArray", userResponseArray);
    let faculty_selected = [];
    facultyList.forEach((name) => {
      faculty_selected.push(
        userResponseArray.filter((userObj) => userObj.name === name)[0]
      );
    });
    return faculty_selected;
  };

  const handleChange = (e) => {
    if ([e.target.name] == "title") {
      updateFormData({
        ...formData,
        [e.target.name]: e.target.value,
        ["slug"]: slugify(e.target.value.trim()),
      });
    } else {
      updateFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleDateChange = (e) => {
    setDate(e);
  };

  const handleFacultySelect = (e) => {
    const {
      target: { value },
    } = e;
    setFacultySelected(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  const onSubmit = async () => {
    let postData = {
      ...formData,
      date: dayjs(date).format("YYYY-MM-DD"),
      u_id: facultySelected.map((selectedObj) => selectedObj.id),
    };

    api
      .put(`workshops/edit/` + id + "/", postData)
      .then(() => {
        navigate("/workshops/" + id);
      })
      .catch((error) => {
        if (error.response.status === 401) {
          alert("Authentication has expired! Please re-login");
          navigate("/logout");
        } else if (error.response.status === 403) {
          alert("You do not have permission to perform this action!");
          navigate("/workshops/" + id);
        } else {
          alert("Error! Please check the values entered for any mistakes....");
        }
      });
  };

  return (
    <Container
      maxWidth="sm"
      className="border-solid border-1 border-[#27447e] my-5 shadow-xl shadow-blue-500/50"
    >
      <Box mt={3} mb={3}>
        <Typography
          component="h1"
          variant="h5"
          gutterBottom
          className="text-3xl font-semibold mb-3 text-center"
        >
          Edit Workshop
        </Typography>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3" controlId="formBasicEventName">
            <TextField
              // basic
              type="text"
              name="event_name"
              value={formData.event_name}
              //mui
              label="Event Name"
              variant="outlined"
              fullWidth
              //hook form
              {...register("event_name")}
              //to override onChange
              onChange={handleChange}
            />
            <small className="text-danger">
              {errors.event_name ? errors.event_name.message : <span></span>}
            </small>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicVenue">
            <TextField
              // basic
              type="text"
              name="venue"
              value={formData.venue}
              //mui
              label="Venue"
              variant="outlined"
              fullWidth
              multiline
              //hook form
              {...register("venue")}
              //to override onChange
              onChange={handleChange}
            />
            <small className="text-danger">
              {errors.venue ? errors.venue.message : <span></span>}
            </small>
          </Form.Group>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <FormControl>
                <DatePicker
                  label="Date of Workshop"
                  value={date}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} />}
                />
              </FormControl>
            </Grid>
            <Grid item xs={8}>
              <Form.Group className="mb-3" controlId="formBasicFacultyInvolved">
                <FormControl fullWidth>
                  <InputLabel id="u_id-select-label">
                    Faculty Involved
                  </InputLabel>
                  <Select
                    // basic
                    name="u_id"
                    value={facultySelected}
                    // {...register("u_id")}
                    //overriding onChange
                    onChange={handleFacultySelect}
                    // mui
                    multiple
                    labelId="u_id-select-label"
                    label="Faculty Involved"
                    renderValue={(selected) => {
                      let selectedItems = selected.map(
                        (selectedObj) => selectedObj.name
                      );
                      return selectedItems.join(", ");
                    }}
                    inputProps={{ MenuProps: { disableScrollLock: true } }}
                  >
                    {users.map((user) => {
                      return (
                        <MenuItem key={user.id} value={user}>
                          <Checkbox
                            checked={facultySelected.indexOf(user) > -1}
                          />
                          <ListItemText primary={user.name} />
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                <small className="text-danger">
                  {errors.u_id ? errors.u_id.message : <span></span>}
                </small>
              </Form.Group>
            </Grid>
          </Grid>

          <Button variant="contained" color="primary" type="submit" fullWidth>
            Edit
          </Button>
        </Form>
      </Box>
    </Container>
  );
};

export default EditWorkshop;
