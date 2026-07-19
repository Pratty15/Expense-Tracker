import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config/api";
import "./Groups.css";

function Groups() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [member, setMember] = useState("");
  const [members, setMembers] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.log(err);
    }
  };

  const addMember = () => {
    if (!member.trim()) return;

    setMembers((prev) => [
      ...prev,
      {
        name: member,
      },
    ]);

    setMember("");
  };

  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const createGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupName,
          description,
          members,
        }),
      });

      if (res.ok) {
        setGroupName("");
        setDescription("");
        setMembers([]);
        fetchGroups();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const deleteGroup = async (id) => {
    try {
      await fetch(`${API_BASE}/api/groups/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchGroups();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="groups-page">
      <div className="group-card">

        <h2>Groups</h2>

        <form onSubmit={createGroup}>

          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="member-row">

            <input
              type="text"
              placeholder="Member Name"
              value={member}
              onChange={(e) => setMember(e.target.value)}
            />

            <button
              type="button"
              onClick={addMember}
            >
              Add
            </button>

          </div>

          <div className="members-list">

            {members.map((m, index) => (
              <span
                key={index}
                className="member-chip"
              >
                {m.name}

                <button
                  type="button"
                  onClick={() => removeMember(index)}
                >
                  ×
                </button>

              </span>
            ))}

          </div>

          <button
            type="submit"
            className="create-btn"
          >
            Create Group
          </button>

        </form>

        <h3>My Groups</h3>

        <div className="group-list">

          {groups.length === 0 ? (
            <p>No groups created yet.</p>
          ) : (
            groups.map((group) => (
              <div
                key={group._id}
                className="group-item"
                onClick={() => navigate(`/groups/${group._id}`)}
              >

                <div>

                  <h4>{group.groupName}</h4>

                  <p>{group.description}</p>

                  <small>
                    Members : {group.members.length + 1}
                  </small>

                </div>

                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGroup(group._id);
                  }}
                >
                  Delete
                </button>

              </div>
            ))
          )}

        </div>

      </div>
    </div>
  );
}

export default Groups;