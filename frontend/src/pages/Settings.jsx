import React, { useEffect, useState } from "react";
import useExpense from "../context/expenseContext";
import { useToast } from "../components/useToast";
import { ButtonSpinner } from "../components/UiStates";

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const isGoogleEmail = (email = "") => /^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email.trim());

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-bs-theme", theme);
  localStorage.setItem("theme", theme);
};

const initialsFromName = (name = "") =>
  name.trim().split(" ").filter(Boolean).map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "?";

const fmtMoney = (value, currency = "INR") => {
  if (value === undefined || value === null || value === "") return "";
  const symbol = { INR: "\u20b9", USD: "$", EUR: "\u20ac", GBP: "\u00a3" }[currency] || "";
  return `${symbol}${Number(value).toLocaleString("en-IN")}`;
};

const SummaryItem = ({ icon, label, value, fallback }) => {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== "";
  return (
    <div className="theme-card-muted p-3 mb-3">
      <div className="d-flex align-items-center gap-3">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 34, height: 34, background: "rgba(59,130,246,.12)" }}>
          <i className={`fa-solid ${icon}`} style={{ color: "var(--app-primary)", fontSize: 13 }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="text-secondary" style={{ fontSize: 12 }}>{label}</div>
          <div className={`fw-semibold mt-1 text-truncate ${hasValue ? "" : "text-secondary"}`} style={{ fontSize: 14 }}>
            {hasValue ? value : fallback}
          </div>
        </div>
      </div>
    </div>
  );
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Section = ({ label, children }) => (
  <div className="mb-4">
    <p className="theme-section-label mb-2 px-1">{label}</p>
    <div className="theme-card overflow-hidden">{children}</div>
  </div>
);

const SettingRow = ({ icon, iconBg, iconColor, title, subtitle, right, danger, onClick }) => (
  <div className="theme-row d-flex align-items-center gap-3 px-3 px-md-4 py-3" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
    <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 36, height: 36, background: iconBg }}>
      <i className={`fa-solid ${icon}`} style={{ color: iconColor, fontSize: 14 }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className={danger ? "text-danger" : ""} style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      <div className="text-secondary text-truncate" style={{ fontSize: 11 }}>{subtitle}</div>
    </div>
    {right}
  </div>
);

export default function Settings() {
  const { logout, user, updateProfile, changeEmail, changePassword } = useExpense();
  const { showToast } = useToast();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [notifs, setNotifs] = useState(() => JSON.parse(localStorage.getItem("pref_notifs") || "true"));
  const [profile, setProfile] = useState({
    name: user?.name || "",
    avatar: user?.avatar || "",
    monthlyIncome: user?.monthlyIncome || "",
    budgetAmount: user?.budgetAmount || "",
    budgetPeriod: user?.budgetPeriod || "monthly",
    savingsGoal: user?.savingsGoal || "",
  });
  const [email, setEmail] = useState(user?.email || "");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isDarkMode = theme === "dark";
  const hasProfileChanges =
    profile.name.trim() !== (user?.name || "") ||
    profile.avatar !== (user?.avatar || "") ||
    String(profile.monthlyIncome || "") !== String(user?.monthlyIncome || "") ||
    String(profile.budgetAmount || "") !== String(user?.budgetAmount || "") ||
    profile.budgetPeriod !== (user?.budgetPeriod || "monthly") ||
    String(profile.savingsGoal || "") !== String(user?.savingsGoal || "");
  const hasEmailChanges = email.trim().toLowerCase() !== (user?.email || "").toLowerCase();
  const summaryName = profile.name.trim() || user?.name || "User";
  const summaryEmail = email.trim() || user?.email || "";
  const summaryCurrency = "INR";
  const profileCompletion = [
    summaryName && summaryName !== "User",
    profile.avatar || user?.avatar,
    summaryEmail,
    profile.monthlyIncome || user?.monthlyIncome,
    profile.budgetAmount || user?.budgetAmount,
    profile.savingsGoal || user?.savingsGoal,
  ].filter(Boolean).length;
  const profileCompletionPercent = Math.round((profileCompletion / 6) * 100);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setProfile({
      name: user?.name || "",
      avatar: user?.avatar || "",
      monthlyIncome: user?.monthlyIncome || "",
      budgetAmount: user?.budgetAmount || "",
      budgetPeriod: user?.budgetPeriod || "monthly",
      savingsGoal: user?.savingsGoal || "",
    });
    setEmail(user?.email || "");
  }, [user]);

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotifications = () => {
    const next = !notifs;
    setNotifs(next);
    localStorage.setItem("pref_notifs", JSON.stringify(next));
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileMessage("");
    setProfileError("");
    if (!file.type.startsWith("image/")) return setProfileError("Upload a valid image file.");
    if (file.size > MAX_PHOTO_SIZE) return setProfileError("Choose an image smaller than 10 MB.");
    try {
      updateProfileField("avatar", await fileToDataUrl(file));
    } catch {
      setProfileError("Could not read that image. Please try another file.");
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");
    if (!profile.name.trim()) return setProfileError("Name is required.");

    setSavingProfile(true);
    try {
      const nextProfile = {
        name: profile.name.trim(),
        avatar: profile.avatar,
        monthlyIncome: profile.monthlyIncome,
        budgetAmount: profile.budgetAmount,
        budgetPeriod: profile.budgetPeriod,
        savingsGoal: profile.savingsGoal,
      };
      await updateProfile(nextProfile);
      setProfile(nextProfile);
      setProfileMessage("Profile details updated.");
      showToast("Profile details updated.", "success");
      setTimeout(() => setProfileMessage(""), 2500);
    } catch (err) {
      setProfileError(err.message || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveEmail = async (e) => {
    e.preventDefault();
    setEmailMessage("");
    setEmailError("");
    if (!isGoogleEmail(email)) return setEmailError("Use a valid Gmail or Googlemail address.");

    setSavingEmail(true);
    try {
      const nextEmail = email.trim().toLowerCase();
      await changeEmail(nextEmail);
      setEmail(nextEmail);
      setEmailMessage("Email updated successfully.");
      showToast("Email updated successfully.", "success");
      setTimeout(() => setEmailMessage(""), 2500);
    } catch (err) {
      setEmailError(err.message || "Could not update email.");
    } finally {
      setSavingEmail(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (!passwords.currentPassword || !passwords.newPassword) return setPasswordError("Enter your current and new password.");
    if (passwords.newPassword.length < 6) return setPasswordError("New password must be at least 6 characters.");
    if (passwords.newPassword !== passwords.confirmPassword) return setPasswordError("New password and confirmation do not match.");

    setSavingPassword(true);
    try {
      await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage("Password changed successfully.");
      showToast("Password changed successfully.", "success");
      setTimeout(() => setPasswordMessage(""), 2500);
    } catch (err) {
      setPasswordError(err.message || "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="theme-page mt-4 mb-5 pb-4">
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, background: "rgba(148,163,184,.16)" }}>
              <i className="fa-solid fa-gear" style={{ color: "var(--app-muted-2)", fontSize: 14 }} />
            </div>
            <h4 className="fw-semibold mb-0">Settings</h4>
          </div>
          <small className="text-secondary">Manage your profile, financial preferences, email, and password.</small>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <Section label="Profile & financial details">
            <form onSubmit={saveProfile} className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                <div className="profile-preview rounded-circle d-flex align-items-center justify-content-center overflow-hidden">
                  {profile.avatar ? <img src={profile.avatar} alt="Profile preview" /> : <span>{initialsFromName(profile.name || user?.name)}</span>}
                </div>

                <div style={{ flex: 1, minWidth: 220 }}>
                  <p className="fw-semibold mb-1" style={{ fontSize: 14 }}>Profile photo</p>
                  <small className="text-secondary d-block mb-2">Upload any image type under 10 MB.</small>
                  <div className="d-flex gap-2 flex-wrap">
                    <label className="btn btn-sm rounded-3 theme-chip mb-0" style={{ cursor: "pointer", fontSize: 12 }}>
                      <i className="fa-solid fa-upload me-2" />
                      Upload photo
                      <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                    </label>
                    {profile.avatar && (
                      <button type="button" className="btn btn-sm rounded-3 theme-chip" style={{ fontSize: 12 }} onClick={() => updateProfileField("avatar", "")}>
                        <i className="fa-solid fa-trash-can me-2" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>DISPLAY NAME</label>
                  <input className="form-control theme-input py-3" value={profile.name} onChange={(e) => updateProfileField("name", e.target.value)} placeholder="Your name" maxLength={50} />
                </div>

                <div className="col-12 col-md-4">
                  <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>MONTHLY INCOME</label>
                  <input type="number" min="0" className="form-control theme-input py-3" value={profile.monthlyIncome} onChange={(e) => updateProfileField("monthlyIncome", e.target.value)} placeholder="0" />
                </div>
                <div className="col-12 col-md-4">
                  <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>BUDGET PERIOD</label>
                  <select className="form-select theme-input py-3" value={profile.budgetPeriod} onChange={(e) => updateProfileField("budgetPeriod", e.target.value)}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>BUDGET AMOUNT</label>
                  <input type="number" min="0" className="form-control theme-input py-3" value={profile.budgetAmount} onChange={(e) => updateProfileField("budgetAmount", e.target.value)} placeholder="0" />
                </div>
                <div className="col-12 col-md-4">
                  <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>SAVINGS GOAL</label>
                  <input type="number" min="0" className="form-control theme-input py-3" value={profile.savingsGoal} onChange={(e) => updateProfileField("savingsGoal", e.target.value)} placeholder="0" />
                </div>
              </div>

              {profileError && <div className="rounded-3 py-2 px-3 mt-3" style={{ background: "rgba(239,68,68,.12)", color: "var(--app-danger)", fontSize: 13 }}>{profileError}</div>}
              {profileMessage && <div className="rounded-3 py-2 px-3 mt-3" style={{ background: "rgba(16,185,129,.12)", color: "var(--app-success)", fontSize: 13 }}>{profileMessage}</div>}

              <button type="submit" disabled={!hasProfileChanges || savingProfile} className="btn fw-semibold py-3 w-100 mt-3" style={{ background: hasProfileChanges ? "var(--app-primary)" : "var(--app-surface-3)", color: hasProfileChanges ? "#fff" : "var(--app-muted)", border: 0, borderRadius: 8, fontSize: 14 }}>
                {savingProfile ? <ButtonSpinner label="Saving..." /> : "Save Profile Details"}
              </button>
            </form>
          </Section>

          <Section label="Email">
            <form onSubmit={saveEmail} className="p-3 p-md-4">
              <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>GOOGLE EMAIL</label>
              <input type="email" className="form-control theme-input py-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" />
              <small className="text-secondary d-block mt-2" style={{ fontSize: 12 }}>Only Gmail or Googlemail addresses are accepted.</small>
              {emailError && <div className="rounded-3 py-2 px-3 mt-3" style={{ background: "rgba(239,68,68,.12)", color: "var(--app-danger)", fontSize: 13 }}>{emailError}</div>}
              {emailMessage && <div className="rounded-3 py-2 px-3 mt-3" style={{ background: "rgba(16,185,129,.12)", color: "var(--app-success)", fontSize: 13 }}>{emailMessage}</div>}
              <button type="submit" disabled={!hasEmailChanges || savingEmail} className="btn fw-semibold py-3 w-100 mt-3" style={{ background: hasEmailChanges ? "var(--app-primary)" : "var(--app-surface-3)", color: hasEmailChanges ? "#fff" : "var(--app-muted)", border: 0, borderRadius: 8, fontSize: 14 }}>
                {savingEmail ? <ButtonSpinner label="Updating..." /> : "Change Email"}
              </button>
            </form>
          </Section>

          <Section label="Password">
            <form onSubmit={savePassword} className="p-3 p-md-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>CURRENT PASSWORD</label>
                  <input type="password" className="form-control theme-input py-3" value={passwords.currentPassword} onChange={(e) => setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))} placeholder="Enter current password" />
                </div>
                <div className="col-12 col-md-6">
                  <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>NEW PASSWORD</label>
                  <input type="password" className="form-control theme-input py-3" value={passwords.newPassword} onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))} placeholder="Min 6 characters" />
                </div>
                <div className="col-12 col-md-6">
                  <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>CONFIRM PASSWORD</label>
                  <input type="password" className="form-control theme-input py-3" value={passwords.confirmPassword} onChange={(e) => setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
                </div>
              </div>
              {passwordError && <div className="rounded-3 py-2 px-3 mt-3" style={{ background: "rgba(239,68,68,.12)", color: "var(--app-danger)", fontSize: 13 }}>{passwordError}</div>}
              {passwordMessage && <div className="rounded-3 py-2 px-3 mt-3" style={{ background: "rgba(16,185,129,.12)", color: "var(--app-success)", fontSize: 13 }}>{passwordMessage}</div>}
              <button type="submit" disabled={savingPassword} className="btn fw-semibold py-3 w-100 mt-3" style={{ background: "var(--app-primary)", color: "#fff", border: 0, borderRadius: 8, fontSize: 14 }}>
                {savingPassword ? <ButtonSpinner label="Changing..." /> : "Change Password"}
              </button>
            </form>
          </Section>

          <Section label="Appearance">
            <SettingRow
              icon={isDarkMode ? "fa-moon" : "fa-sun"}
              iconBg={isDarkMode ? "rgba(111,66,193,.15)" : "rgba(245,158,11,.16)"}
              iconColor={isDarkMode ? "#8b5cf6" : "var(--app-warning)"}
              title="Theme mode"
              subtitle={isDarkMode ? "Dark mode is active" : "Light mode is active"}
              right={<div className="form-check form-switch m-0"><input className="form-check-input" type="checkbox" role="switch" checked={isDarkMode} onChange={() => setTheme(isDarkMode ? "light" : "dark")} style={{ cursor: "pointer" }} /></div>}
            />
          </Section>

          <Section label="Application">
            <SettingRow
              icon="fa-bell"
              iconBg="rgba(16,185,129,.15)"
              iconColor="var(--app-success)"
              title="Push notifications"
              subtitle="Alerts for new transactions and account activity"
              right={<div className="form-check form-switch m-0"><input className="form-check-input" type="checkbox" checked={notifs} onChange={handleNotifications} /></div>}
            />
          </Section>

          <Section label="Account">
            <SettingRow icon="fa-right-from-bracket" iconBg="rgba(239,68,68,.12)" iconColor="var(--app-danger)" title="Logout" subtitle={`Signed in as ${user?.email || "your account"}`} danger onClick={logout} />
          </Section>
        </div>

        <div className="col-12 col-xl-5">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
              <div>
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Profile summary</p>
                <small className="text-secondary">Budget preferences at a glance.</small>
              </div>
              <span className="rounded-3 px-2 py-1" style={{ background: "rgba(59,130,246,.12)", color: "var(--app-primary)", fontSize: 11 }}>{profileCompletionPercent}% complete</span>
            </div>

            <div className="theme-card-muted p-3 mb-3 text-center">
              <div className="profile-preview mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center overflow-hidden" style={{ width: 86, height: 86 }}>
                {profile.avatar || user?.avatar ? <img src={profile.avatar || user?.avatar} alt="Profile" /> : <span>{initialsFromName(summaryName)}</span>}
              </div>
              <div className="fw-semibold text-truncate">{summaryName}</div>
              <div className="text-secondary text-truncate" style={{ fontSize: 12 }}>{summaryEmail || "Add Google email"}</div>
            </div>

            <SummaryItem icon="fa-money-bill-trend-up" label="Monthly income" value={fmtMoney(profile.monthlyIncome || user?.monthlyIncome, summaryCurrency)} fallback="Add income" />
            <SummaryItem icon="fa-chart-pie" label={`Budget (${profile.budgetPeriod || user?.budgetPeriod || "monthly"})`} value={fmtMoney(profile.budgetAmount || user?.budgetAmount, summaryCurrency)} fallback="Add budget" />
            <SummaryItem icon="fa-bullseye" label="Savings goal" value={fmtMoney(profile.savingsGoal || user?.savingsGoal, summaryCurrency)} fallback="Add savings goal" />

            <div className="theme-card-muted p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary" style={{ fontSize: 12 }}>Profile completion</span>
                <span className="fw-semibold" style={{ fontSize: 12, color: "var(--app-primary)" }}>{profileCompletionPercent}%</span>
              </div>
              <div style={{ height: 7, background: "var(--app-surface-3)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${profileCompletionPercent}%`, height: "100%", background: "linear-gradient(135deg, var(--app-primary), #7c3aed)", borderRadius: 999 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
