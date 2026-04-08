import React from "react";

const Support = () => {
  return (
    <div className=" text-light mt-4 mb-4 ">
      <h3 className="mb-4">🛠 Support</h3>

      <div className="card bg-black text-light rounded-4 p-4 ">

        {/* Intro */}
        <h5>Need Help?</h5>
        <p className="text-secondary">
          We’re here to help you with any issues related to your Expense Tracker.
          Check the common questions below or contact us directly.
        </p>

        <hr className="border-secondary" />

        {/* FAQ */}
        <h6 className="mt-3">Frequently Asked Questions</h6>

        <div className="mt-3">
          <p className="fw-semibold mb-1">
            ❓ Why is my balance not updating?
          </p>
          <p className="text-secondary">
            Ensure all transaction fields are filled and amounts are entered
            correctly.
          </p>
        </div>

        <div className="mt-3">
          <p className="fw-semibold mb-1">
            ❓ Can I delete a transaction?
          </p>
          <p className="text-secondary">
            This feature will be available in a future update.
          </p>
        </div>

        <div className="mt-3">
          <p className="fw-semibold mb-1">
            ❓ Why does my data disappear after refresh?
          </p>
          <p className="text-secondary">
            Persistent storage (localStorage) will be added soon.
          </p>
        </div>

        <hr className="border-secondary mt-4" />

        {/* Contact */}
        <h6 className="mt-3">Contact Support</h6>

        <form className="mt-3">

          <div className="mb-3">
            <label className="form-label">Your Email</label>
            <input
              type="email"
              className="form-control bg-dark text-light border-secondary"
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Message</label>
            <textarea
              rows="4"
              className="form-control bg-dark text-light border-secondary"
              placeholder="Describe your issue"
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary px-4">
            Submit
          </button>

        </form>
      </div>
    </div>
  );
};

export default Support;
