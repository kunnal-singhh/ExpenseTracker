import React from "react";

export default function Support() {
  const faqs = [
    { q: "Is my data safe?", a: "Yes, your transactions stay tied to your private account.", icon: "fa-shield-halved", color: "var(--app-primary)" },
    { q: "How do I correct a transaction?", a: "Open Transaction History, delete the incorrect record, then add it again.", icon: "fa-pen-to-square", color: "var(--app-warning)" },
    { q: "Can I export my data?", a: "PDF and CSV export options are planned for a future update.", icon: "fa-file-export", color: "#8b5cf6" },
  ];

  return (
    <div className="theme-page mt-4 mb-5 pb-4">
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, background: "rgba(59,130,246,.14)" }}>
              <i className="fa-solid fa-circle-question" style={{ color: "var(--app-primary)", fontSize: 14 }} />
            </div>
            <h4 className="fw-semibold mb-0">Help & support</h4>
          </div>
          <small className="text-secondary">Find answers or send a note to the support team.</small>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Frequently asked questions</p>
                <small className="text-secondary">Quick help for common workflows</small>
              </div>
            </div>

            <div className="d-flex flex-column gap-2">
              {faqs.map((item) => (
                <div key={item.q} className="theme-card-muted p-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: 13 }} />
                    <div className="fw-semibold" style={{ fontSize: 13 }}>{item.q}</div>
                  </div>
                  <div className="text-secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Contact us</p>
              <small className="text-secondary">Share an issue, request, or account question.</small>
            </div>

            <form className="d-flex flex-column gap-3">
              <div>
                <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>SUBJECT</label>
                <input type="text" className="form-control theme-input py-3" placeholder="What is this about?" />
              </div>
              <div>
                <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>MESSAGE</label>
                <textarea className="form-control theme-input py-3" rows="5" placeholder="How can we help?" />
              </div>
              <button className="btn btn-primary fw-semibold py-3" style={{ borderRadius: 8, fontSize: 14 }}>Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
