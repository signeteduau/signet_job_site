"use client"
import React, { useState } from "react";
import ShortSelect from "../common/short-select";
import candidate_data from "@/data/candidate-data";
import CandidateGridItem from "./candidate-grid-item";
import CandidateListItem from "./candidate-list-item";
import CandidateFilterModal from "../common/popup/candidate-filter-modal";

const CandidateV3Area = ({ style_2 }: { style_2?: boolean }) => {
  const [jobType, setJobType] = useState<string>(style_2 ? "list" : "grid");
  return (
    <>
    <section className="candidates-profile bg-color pt-90 lg-pt-70 pb-160 xl-pb-150 lg-pb-80">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="position-relative">
              <div className="upper-filter d-flex justify-content-between align-items-start align-items-md-center mb-20">
                <div className="d-md-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="filter-btn fw-500 tran3s me-3"
                    data-bs-toggle="modal"
                    data-bs-target="#filterPopUp"
                  >
                    <i className="bi bi-funnel"></i>
                    Filter
                  </button>
                  <div className="total-job-found md-mt-10">
                    All <span className="text-dark fw-500">{candidate_data.length}</span>{" "}
                    candidates found
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="short-filter d-flex align-items-center">
                    <div className="text-dark fw-500 me-2">Short:</div>
                    <ShortSelect />
                  </div>
                  <button
                    onClick={() => setJobType("list")}
                    className={`style-changer-btn text-center rounded-circle tran3s ms-2 list-btn ${jobType === "grid" ? "active" : ""}`}
                    title="Active List"
                  >
                    <i className="bi bi-list"></i>
                  </button>
                  <button
                    onClick={() => setJobType("grid")}
                    className={`style-changer-btn text-center rounded-circle tran3s ms-2 grid-btn ${jobType === "list" ? "active" : ""}`}
                    title="Active Grid"
                  >
                    <i className="bi bi-grid"></i>
                  </button>
                </div>
              </div>

              <div
                className={`accordion-box grid-style ${jobType === "grid" ? "show" : ""}`}
              >
                <div className="row">
                  {candidate_data.map((item) => (
                    <div
                      key={item.id}
                      className="col-xxl-3 col-lg-4 col-sm-6 d-flex"
                    >
                      <CandidateGridItem item={item} style_2={true} />
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`accordion-box list-style ${jobType === "list" ? "show" : ""}`}
              >
                {candidate_data.map((item) => (
                  <CandidateListItem key={item.id} item={item} style_2={true} />
                ))}
              </div>

              {candidate_data.length === 0 && (
                <div className="text-center pt-60 pb-60">
                  <h4 className="fw-500">No candidates found</h4>
                  <p className="m0">Candidate profiles will appear here soon.</p>
                </div>
              )}

              {candidate_data.length > 0 && (
                <div className="pt-20 d-sm-flex align-items-center justify-content-between">
                  <p className="m0 order-sm-last text-center text-sm-start xs-pb-20">
                    Showing <span className="text-dark fw-500">1 to {candidate_data.length}</span> of{" "}
                    <span className="text-dark fw-500">{candidate_data.length}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* filter modal start */}
    <CandidateFilterModal/>
    {/* filter modal end */}
    </>
  );
};

export default CandidateV3Area;
