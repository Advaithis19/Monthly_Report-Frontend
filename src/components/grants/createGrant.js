import React, { useState, useEffect } from "react";
import useAxios from "../../utils/axios";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { years } from "../../constants/years";

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
import Typography from "@material-ui/core/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
//styling
// import { makeStyles } from "@material-ui/core/styles";

import { getUsers } from "../../services/users";
import { trackPromise } from "react-promise-tracker";

//yup
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

const CreateGrant = () => {
  // form validation rules
  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    agency: Yup.string().required("Agency is required"),
    sanc_amt: Yup.string().required("Amount is required"),
  });
  const formOptions = { resolver: yupResolver(validationSchema) };

  // get functions to build form with useForm() hook
  const { register, handleSubmit, formState } = useForm(formOptions);
  const { errors } = formState;

  let api = useAxios();
  api.defaults.xsrfCookieName = "csrftoken";
  api.defaults.xsrfHeaderName = "X-CSRFToken";

  //https://gist.github.com/hagemann/382adfc57adbd5af078dc93feef01fe1
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
  const initialFormData = Object.freeze({
    title: "",
    agency: "",
    sanc_amt: "",
    year: 2022,
    remarks: "",
    slug: "",
    PI: "",
    CO_PI: "",
  });

  const [formData, updateFormData] = useState(initialFormData);
  const [users, setUsers] = useState([]);

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
  }, []);

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

  const handlePISelect = (e) => {
    updateFormData({
      ...formData,
      ["PI"]: e.target.value,
    });
  };

  const handleCO_PISelect = (e) => {
    updateFormData({
      ...formData,
      ["CO_PI"]: e.target.value,
    });
  };

  const handleYearSelect = (e) => {
    updateFormData({
      ...formData,
      ["year"]: e.target.value,
    });
  };

  const onSubmit = async (e) => {
    let postData = new FormData();
    postData.append("title", formData.title);
    postData.append("agency", formData.agency);
    postData.append("sanc_amt", formData.sanc_amt);
    postData.append("year", formData.year);
    postData.append("remarks", formData.remarks);
    postData.append("slug", formData.slug);
    postData.append("PI", formData.PI);
    postData.append("CO_PI", formData.CO_PI);
    api
      .post(`grants/create/`, postData)
      .then(() => {
        navigate("/grants/");
        // window.location.reload();
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

  return (
    <Container maxWidth="sm">
      <Box mt={3} mb={3}>
        <Typography component="h1" variant="h5" gutterBottom>
          Create Grant
        </Typography>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3" controlId="formBasicTitle">
            <TextField
              // basic
              type="text"
              name="title"
              value={formData.title}
              //mui
              label="Grant Title"
              variant="outlined"
              fullWidth
              //hook form
              {...register("title")}
              //to override onChange
              onChange={handleChange}
            />
            {errors.title?.message}
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicAgency">
            <TextField
              // basic
              type="text"
              name="agency"
              value={formData.agency}
              //mui
              label="Agency"
              variant="outlined"
              fullWidth
              multiline
              //hook form
              {...register("agency")}
              //to override onChange
              onChange={handleChange}
            />
            {errors.agency?.message}
          </Form.Group>

          <Grid container spacing={2}>
            <Grid item sm={12} md={8}>
              <Form.Group className="mb-3" controlId="formBasicAmount">
                <TextField
                  // basic
                  type="text"
                  name="sanc_amt"
                  value={formData.sanc_amt}
                  //mui
                  label="Sanctioned Amount"
                  variant="outlined"
                  fullWidth
                  //hook form
                  {...register("sanc_amt")}
                  //to override onChange
                  onChange={handleChange}
                />
                {errors.sanc_amt?.message}
              </Form.Group>
            </Grid>
            <Grid item sm={12} md={4}>
              <Form.Group className="mb-3" controlId="formBasicYear">
                <FormControl fullWidth>
                  <InputLabel id="year-select-label">Select Year</InputLabel>
                  <Select
                    // basic
                    name="year"
                    value={formData.year}
                    onChange={handleYearSelect}
                    // mui
                    labelId="year-select-label"
                    label="Select Year"
                  >
                    {years.map((year) => {
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Form.Group>
            </Grid>
          </Grid>

          <Form.Group className="mb-3" controlId="formBasicRemarks">
            <TextField
              // basic
              type="text"
              name="remarks"
              //mui
              label="Remarks"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              onChange={handleChange}
            />
            {errors.remarks?.message}
          </Form.Group>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Form.Group
                className="mb-3"
                controlId="formBasicPrincipleInvestigator"
              >
                <FormControl fullWidth>
                  <InputLabel id="pi-select-label">
                    Principal Investigator
                  </InputLabel>
                  <Select
                    // basic
                    name="PI"
                    value={formData.PI}
                    onChange={handlePISelect}
                    // mui
                    labelId="pi-select-label"
                    label="Principal Investigator"
                  >
                    {users.map((user) => {
                      return (
                        <MenuItem key={user.value} value={user.value}>
                          {user.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Form.Group>
            </Grid>
            <Grid item xs={12} md={6}>
              <Form.Group
                className="mb-3"
                controlId="formBasicCoPrincipleInvestigator"
              >
                <FormControl fullWidth>
                  <InputLabel id="co_pi-select-label">
                    Co-Principal Investigator
                  </InputLabel>
                  <Select
                    // basic
                    name="CO_PI"
                    value={formData.CO_PI}
                    onChange={handleCO_PISelect}
                    // mui
                    labelId="co_pi-select-label"
                    label="Co-Principal Investigator"
                  >
                    {users.map((user) => {
                      return (
                        <MenuItem key={user.value} value={user.value}>
                          {user.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Form.Group>
            </Grid>
          </Grid>

          <Button variant="contained" color="primary" type="submit" fullWidth>
            Create
          </Button>
        </Form>
      </Box>
    </Container>
  );
};

export default CreateGrant;