import React, { useEffect, useRef } from "react";
import $ from "jquery";

window.$ = $;
window.jQuery = $;

import "datatables.net";
import { axiosPrivate } from "./common/axios";

const DemandListing = () => {

  // 🔹 Picklist maps
  const categoryMap = useRef({});
  const priorityMap = useRef({});

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await loadPicklists();
    await fetchDemands();
  };

  /* ---------------- PICKLIST LOAD ---------------- */

  const loadPicklists = async () => {
    try {
      const res = await axiosPrivate.get(
        "/o/headless-admin-list-type/v1.0/list-type-definitions"
      );
      console.log("Picklist Result ",res);

      res.data.items.forEach(def => {
        if (def.externalReferenceCode === "CATEGORY") {
          def.listTypeEntries.forEach(e => {
           categoryMap.current[e.externalReferenceCode] = e.name;
          });
        }

        if (def.externalReferenceCode === "PRIORITY") {
          def.listTypeEntries.forEach(e => {
            priorityMap.current[e.externalReferenceCode] = e.name;
          });
        }
      });

    } catch (err) {
      console.error("Error loading picklists", err);
    }
  };

  /* ---------------- DEMANDS LOAD ---------------- */

  const fetchDemands = async () => {
    try {
      const scopeGroupId = Liferay.ThemeDisplay.getScopeGroupId();

      const res = await axiosPrivate.get(
        `/o/c/demandintakes/scopes/${scopeGroupId}`
      );

      initDataTable(res.data?.items || []);
    } catch (err) {
      console.error("Error fetching demands", err);
    }
  };

  /* ---------------- DATATABLE INIT ---------------- */

  const initDataTable = (items) => {

    if ($.fn.DataTable.isDataTable("#demandTable")) {
      $("#demandTable").DataTable().clear().destroy(true);
    }

    $("#demandTable").DataTable({
      data: items,

      dom: "rtip",
      searching: false,
      lengthChange: false,

      paging: true,
      ordering: false,
      info: true,

      autoWidth: false,
      deferRender: true,

      columns: [
        { title: "Item", data: "name" },
        {
          title: "Date",
          data: "dateCreated",
          render: d => d ? new Date(d).toLocaleDateString() : "-"
        },
        { title: "Demand ID", data: "demandId" },
        { title: "Azure ID", data: "azureId" },
        { title: "Initiator", data: "initiator" },
        { title: "Initiator Team", data: "initiatorTeam" },
        { title: "Business Sponsor", data: "businessSponsor" },
        { title: "Demand Description", data: "name" },

        /* ✅ CATEGORY PICKLIST */
        {
          title: "Category",
          data: "category",
          render: key =>
            categoryMap.current[key] || "-"
        },

        /* ✅ PRIORITY PICKLIST */
        {
          title: "Priority",
          data: "priority",
          render: key =>
            priorityMap.current[key] || "-"
        },

        {
          title: "Demand Stage",
          data: "demandStage",
          defaultContent: "-"
        }
      ]
    });
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        id="demandTable"
        className="display nowrap"
        style={{ width: "100%" }}
      />
    </div>
  );
};

export default DemandListing;
