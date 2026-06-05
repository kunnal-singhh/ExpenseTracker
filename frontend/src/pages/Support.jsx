import React, { useState, useEffect } from "react";
import { supportAPI } from "../services/api";
import { ButtonSpinner } from "../components/UiStates";

export default function Support() {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await supportAPI.getAll();
        if (data && data.requests) {
          setMyRequests(data.requests);
        }
      } catch (err) {
        console.error("Failed to fetch support requests", err);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, []);

  const faqs = [
    { q: "Is my data safe?", a: "Yes, your transactions stay tied to your private account.", icon: "fa-shield-halved", color: "var(--app-primary)" },
    { q: "How do I correct a transaction?", a: "Open Transaction History, delete the incorrect record, then add it again.", icon: "fa-pen-to-square", color: "var(--app-warning)" },
    { q: "Can I export my data?", a: "PDF and CSV export options are planned for a future update.", icon: "fa-file-export", color: "#8b5cf6" },
  ];

  const updateField = (field, value) => {
    setError("");
    setMessage("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitSupportRequest = async (e) => {
    e.preventDefault();
    const subject = form.subject.trim();
    const requestMessage = form.message.trim();

    if (!subject || !requestMessage) {
      setError("Add both a subject and message before sending.");
      return;
    }

    setSending(true);
    setError("");
    setMessage("");

    try {
      const res = await supportAPI.create({ subject, message: requestMessage });
      setForm({ subject: "", message: "" });
      setMessage("Your query was submitted successfully. The support team can now review it.");
      if (res && res.supportRequest) {
        setMyRequests(prev => [res.supportRequest, ...prev]);
      }
    } catch (err) {
      setError(err.message || "Could not submit your query. Please try again.");
    } finally {
      setSending(false);
    }
  };

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
              <small className="text-secondary">Share an issue, request, or account question with the support team.</small>
            </div>

            <div className="theme-card-muted p-3 mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="fa-solid fa-ticket" style={{ color: "var(--app-primary)", fontSize: 13 }} />
                <span className="fw-semibold" style={{ fontSize: 13 }}>Support ticket</span>
              </div>
              <div className="text-secondary mt-2" style={{ fontSize: 12, lineHeight: 1.5 }}>
                Your query will be saved with your account email so the team can follow up.
              </div>
            </div>

            <form className="d-flex flex-column gap-3" onSubmit={submitSupportRequest}>
              <div>
                <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>SUBJECT</label>
                <input
                  type="text"
                  className="form-control theme-input py-3"
                  placeholder="What is this about?"
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  maxLength="120"
                  disabled={sending}
                />
              </div>
              <div>
                <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>MESSAGE</label>
                <textarea
                  className="form-control theme-input py-3"
                  rows="5"
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  maxLength="2000"
                  disabled={sending}
                />
              </div>
              {error && <div className="rounded-3 py-2 px-3" style={{ background: "rgba(239,68,68,.12)", color: "var(--app-danger)", fontSize: 13 }}>{error}</div>}
              {message && <div className="rounded-3 py-2 px-3" style={{ background: "rgba(16,185,129,.12)", color: "var(--app-success)", fontSize: 13 }}>{message}</div>}
              <button type="submit" disabled={sending} className="btn btn-primary fw-semibold py-3" style={{ borderRadius: 8, fontSize: 14 }}>
                {sending ? <ButtonSpinner label="Submitting..." /> : "Submit Query"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* My Queries Section */}
      <div className="row g-3 mt-1">
        <div className="col-12">
          <div className="theme-card p-3 p-md-4">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>My Queries</p>
              <small className="text-secondary">Track the status of your submitted support tickets.</small>
            </div>
            
            {loadingRequests ? (
              <div className="text-secondary" style={{ fontSize: 13 }}>Loading queries...</div>
            ) : myRequests.length === 0 ? (
              <div className="text-secondary" style={{ fontSize: 13 }}>You haven't submitted any queries yet.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {myRequests.map((req) => (
                  <div key={req._id} className="theme-card-muted p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fw-semibold" style={{ fontSize: 14 }}>{req.subject}</div>
                      <span className={`badge ${req.status === 'open' ? 'bg-primary' : req.status === 'in_progress' ? 'bg-warning text-dark' : 'bg-success'}`}>
                        {req.status === 'open' ? 'Submitted' : req.status === 'in_progress' ? 'In Progress' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-secondary mb-2" style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{req.message}</div>
                    <div className="text-secondary" style={{ fontSize: 11 }}>Submitted on {new Date(req.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
