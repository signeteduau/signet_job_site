import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Wrapper from '@/layouts/wrapper';
import Header from '@/layouts/headers/header';
import FooterOne from '@/layouts/footers/footer-one';
import JobPortalIntro from '../components/job-portal-intro/job-portal-intro';
import JobDetailsBreadcrumb from '../components/jobs/breadcrumb/job-details-breadcrumb';
import JobDetailsV1Area from '../components/job-details/job-details-v1-area';
import job_data from '@/data/job-data';
import RelatedJobs from '../components/jobs/related-jobs';


export const metadata: Metadata = {
  title: "Job Details v1",
};

const JobDetailsV1Page = () => {
  const job = job_data[0];
  return (
    <Wrapper>
      <div className="main-page-wrapper">
        <Header />

        <JobDetailsBreadcrumb />

        {job ? (
          <>
            <JobDetailsV1Area job={job} />
            <RelatedJobs category={job.category} />
          </>
        ) : (
          <section className="job-details pt-100 lg-pt-80 pb-130 lg-pb-80">
            <div className="container text-center">
              <h3>No demo job available</h3>
              <p className="mt-15 mb-30">
                Demo listings were removed. Browse live roles on the Signet board.
              </p>
              <Link href="/jobs" className="btn-one">
                Browse jobs
              </Link>
            </div>
          </section>
        )}

        <JobPortalIntro />
        <FooterOne />
      </div>
    </Wrapper>
  );
};

export default JobDetailsV1Page;