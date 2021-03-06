import React, { useState, useEffect } from "react";
import useAxios from "../../utils/axios";
import Table from "./listTable";
import { useNavigate, useParams } from "react-router-dom";
import { getFilteredConsultancies } from "../../services/consultancies";
import { trackPromise } from "react-promise-tracker";

const FilteredConsultancies = () => {
  const { start_date, end_date } = useParams();
  let navigate = useNavigate();
  let api = useAxios();

  let [consultancies, setConsultancies] = useState([]);

  useEffect(() => {
    let mounted = true;
    trackPromise(
      getFilteredConsultancies(api, start_date, end_date)
        .then((response) => {
          if (mounted) {
            setConsultancies(response.data);
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
  }, [start_date, end_date]);

  if (!consultancies || consultancies.length === 0)
    return (
      <div className="text-center pt-5">
        <p className="text-xl text-bold">
          Can not find any consultancies, sorry
        </p>
      </div>
    );

  return <Table consultancies={consultancies} />;
};

export default FilteredConsultancies;
