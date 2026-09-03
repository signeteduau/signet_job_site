"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import ProfileAvatar from "@/app/components/signet/profile-avatar";
import { PanelShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import {
  acceptedHead,
  acceptedSubs,
  cancelCompanyConnection,
  connectionWithCompany,
  disconnectCompanyConnection,
  respondToCompanyConnection,
  sendCompanyConnectionRequest,
  subscribeCompanyConnections,
  subCompanyLogo,
  subCompanyName,
} from "@/lib/services/company-connections";
import { fetchCompanies } from "@/lib/services/jobs";
import { AppUser, CompanyConnection } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

type CompanyRow = AppUser & { uid: string };

function companyLabel(c: Pick<AppUser, "companyName" | "fullName">) {
  return c.companyName || c.fullName || "Company";
}

function NetworkInner() {
  const { user, profile } = useAuth();
  const [term, setTerm] = useState("");
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [connections, setConnections] = useState<CompanyConnection[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeCompanyConnections(user.uid, setConnections);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const list = (await fetchCompanies(80)) as CompanyRow[];
        setCompanies(list.filter((c) => c.uid && c.uid !== user?.uid));
      } catch {
        toast.error("Could not load companies.");
      } finally {
        setLoadingList(false);
      }
    })();
  }, [user]);

  // Parent receives requests from companies wanting to become children
  const incoming = useMemo(
    () =>
      connections.filter(
        (item) => item.headId === user?.uid && item.status === "pending"
      ),
    [connections, user]
  );
  // Child sent request to a parent, waiting
  const outgoing = useMemo(
    () =>
      connections.filter(
        (item) => item.subId === user?.uid && item.status === "pending"
      ),
    [connections, user]
  );
  const children = useMemo(
    () => (user ? acceptedSubs(connections, user.uid) : []),
    [connections, user]
  );
  const parent = useMemo(
    () => (user ? acceptedHead(connections, user.uid) : undefined),
    [connections, user]
  );

  const q = term.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return [];
    return companies.filter((c) => {
      return (
        companyLabel(c).toLowerCase().includes(q) ||
        (c.industry || "").toLowerCase().includes(q) ||
        (c.companyLocation || c.address || "").toLowerCase().includes(q)
      );
    });
  }, [companies, q]);

  const sendRequest = async (company: CompanyRow) => {
    if (!profile || !user) return;
    setBusyId(company.uid);
    try {
      await sendCompanyConnectionRequest({
        requester: { ...profile, uid: user.uid },
        invitee: company,
        existing: connections,
      });
      toast.success(`Request sent to ${companyLabel(company)}.`);
      setTerm("");
    } catch (err) {
      toast.error(
        err instanceof Error && !err.message.includes("permission")
          ? err.message
          : "Could not send request. Please try again."
      );
    } finally {
      setBusyId("");
    }
  };

  const disconnectFromParent = async (item: CompanyConnection) => {
    const name = item.headName || "parent company";
    if (!confirm(`Disconnect from ${name}? You will no longer be their child company.`)) {
      return;
    }
    setBusyId(item.id);
    try {
      await disconnectCompanyConnection(item.id);
      toast.success(`Disconnected from ${name}.`);
    } catch {
      toast.error("Could not disconnect.");
    } finally {
      setBusyId("");
    }
  };

  const disconnectChild = async (item: CompanyConnection) => {
    const name = subCompanyName(item);
    if (!confirm(`Remove ${name} as a child company?`)) return;
    setBusyId(item.id);
    try {
      await disconnectCompanyConnection(item.id);
      toast.success(`${name} disconnected.`);
    } catch {
      toast.error("Could not disconnect company.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <AppShell
      role="company"
      title="Companies"
      subtitle="Search for a parent company and request to join as their child company."
    >
      {parent && (
        <section className="signet-dash-section">
          <div className="signet-section-head">
            <div>
              <h3>Your parent company</h3>
              <p>You are connected as their child company</p>
            </div>
          </div>
          <div className="signet-network-row">
            <ProfileAvatar
              src={parent.headLogo}
              name={parent.headName}
              size="md"
              rounded="tile"
            />
            <div className="signet-network-copy">
              <strong>{parent.headName}</strong>
              <span>Parent company</span>
            </div>
            <button
              type="button"
              className="signet-btn secondary signet-btn-compact"
              disabled={busyId === parent.id}
              onClick={() => disconnectFromParent(parent)}
            >
              Disconnect
            </button>
          </div>
        </section>
      )}

      {incoming.length > 0 && (
        <section className="signet-dash-section">
          <div className="signet-section-head">
            <div>
              <h3>Incoming requests</h3>
              <p>Accept to make them your child company</p>
            </div>
          </div>
          {incoming.map((item) => (
            <div key={item.id} className="signet-network-row">
              <ProfileAvatar
                src={subCompanyLogo(item)}
                name={subCompanyName(item)}
                size="md"
                rounded="tile"
              />
              <div className="signet-network-copy">
                <strong>{subCompanyName(item)}</strong>
                <span>Wants to join as your child company</span>
              </div>
              <div className="signet-network-actions">
                <button
                  type="button"
                  className="signet-btn signet-btn-compact"
                  disabled={busyId === item.id}
                  onClick={async () => {
                    setBusyId(item.id);
                    try {
                      await respondToCompanyConnection(item.id, "accepted");
                      toast.success(
                        `${subCompanyName(item)} is now your child company.`
                      );
                    } catch {
                      toast.error("Could not accept request.");
                    } finally {
                      setBusyId("");
                    }
                  }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="signet-btn secondary signet-btn-compact"
                  disabled={busyId === item.id}
                  onClick={async () => {
                    setBusyId(item.id);
                    try {
                      await respondToCompanyConnection(item.id, "declined");
                      toast.info("Request declined.");
                    } catch {
                      toast.error("Could not decline request.");
                    } finally {
                      setBusyId("");
                    }
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {children.length > 0 && (
        <section className="signet-dash-section">
          <div className="signet-section-head">
            <div>
              <h3>Child companies</h3>
              <p>Companies connected under you</p>
            </div>
          </div>
          {children.map((item) => (
            <div key={item.id} className="signet-network-row">
              <ProfileAvatar
                src={subCompanyLogo(item)}
                name={subCompanyName(item)}
                size="md"
                rounded="tile"
              />
              <div className="signet-network-copy">
                <strong>{subCompanyName(item)}</strong>
                <span>Child company</span>
              </div>
              <button
                type="button"
                className="signet-btn secondary signet-btn-compact"
                disabled={busyId === item.id}
                onClick={() => disconnectChild(item)}
              >
                Disconnect
              </button>
            </div>
          ))}
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="signet-dash-section">
          <div className="signet-section-head">
            <div>
              <h3>Sent requests</h3>
              <p>Waiting for the parent company to accept</p>
            </div>
          </div>
          {outgoing.map((item) => (
            <div key={item.id} className="signet-network-row">
              <ProfileAvatar
                src={item.headLogo}
                name={item.headName}
                size="md"
                rounded="tile"
              />
              <div className="signet-network-copy">
                <strong>{item.headName}</strong>
                <span>Pending · you will be their child company</span>
              </div>
              <button
                type="button"
                className="signet-btn secondary signet-btn-compact"
                disabled={busyId === item.id}
                onClick={async () => {
                  setBusyId(item.id);
                  try {
                    await cancelCompanyConnection(item.id);
                    toast.info("Request cancelled.");
                  } catch {
                    toast.error("Could not cancel request.");
                  } finally {
                    setBusyId("");
                  }
                }}
              >
                Cancel
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="signet-dash-section">
        <div className="signet-section-head">
          <div>
            <h3>Find a parent company</h3>
            <p>
              Search and send a request to join as their child company
            </p>
          </div>
        </div>
        <div className="signet-field">
          <label>Search</label>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search parent company by name"
            disabled={Boolean(parent) || outgoing.length > 0}
          />
        </div>
        {parent && (
          <div className="signet-network-note">
            Disconnect from your parent company before requesting another.
          </div>
        )}
        {!parent && outgoing.length > 0 && (
          <div className="signet-network-note">
            Cancel your pending request before sending a new one.
          </div>
        )}
        {loadingList && q && <PanelShimmer rows={3} />}
        {!loadingList && q && searchResults.length === 0 && (
          <div className="signet-empty signet-panel">
            <h4>No companies found</h4>
            <p>Try a different search.</p>
          </div>
        )}
        {!loadingList &&
          !parent &&
          outgoing.length === 0 &&
          searchResults.map((company) => {
            const link = user
              ? connectionWithCompany(connections, user.uid, company.uid)
              : undefined;
            const accepted = link?.status === "accepted";
            const pendingOut =
              link?.status === "pending" && link.subId === user?.uid;
            const pendingIn =
              link?.status === "pending" && link.headId === user?.uid;
            return (
              <div key={company.uid} className="signet-network-row">
                <ProfileAvatar
                  src={company.logoUrl || company.profileImage}
                  name={companyLabel(company)}
                  size="md"
                  rounded="tile"
                />
                <div className="signet-network-copy">
                  <strong>{companyLabel(company)}</strong>
                  <span>
                    {[company.industry, company.companyLocation || company.address]
                      .filter(Boolean)
                      .join(" · ") || "Company"}
                  </span>
                </div>
                {accepted ? (
                  <span className="signet-status">Connected</span>
                ) : pendingOut ? (
                  <span className="signet-status">Requested</span>
                ) : pendingIn ? (
                  <span className="signet-status">Incoming</span>
                ) : (
                  <button
                    type="button"
                    className="signet-btn signet-btn-compact"
                    disabled={busyId === company.uid}
                    onClick={() => sendRequest(company)}
                  >
                    {busyId === company.uid ? "Sending…" : "Request"}
                  </button>
                )}
              </div>
            );
          })}
      </section>
    </AppShell>
  );
}

export default function CompanyNetworkPage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <NetworkInner />
      </AuthGate>
    </Wrapper>
  );
}
