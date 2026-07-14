import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import HelpIcon from "@mui/icons-material/Help";

import { supabase } from "../util/supabase";
import type { User } from "@supabase/supabase-js";
import { backendUrl } from "../util/backendConfig";
import type { Quiz } from "../stores/types";

export default function Profile() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    msg: string;
    severity: "success" | "error";
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchUserQuizzes = async () => {
      setQuizzesLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("authorId", user.id);
        const response = await fetch(
          `${backendUrl}/api/get-quizzes?${params.toString()}`,
        );
        if (response.ok) {
          const data = await response.json();
          const normalised: Quiz[] = Array.isArray(data)
            ? data.map((q: any) => ({
                ...q,
                id: typeof q.id === "string" ? q.id : undefined,
                quizItems:
                  Array.isArray(q.quizItems) && q.quizItems.length > 0
                    ? q.quizItems
                    : Array.isArray(q.quizQuestions)
                      ? q.quizQuestions.map((question: any) => ({
                          kind: "question",
                          question,
                        }))
                      : [],
              }))
            : [];
          setQuizzes(normalised);
        }
      } catch (error) {
        console.error("Error fetching user quizzes:", error);
      } finally {
        setQuizzesLoading(false);
      }
    };

    fetchUserQuizzes();
  }, [user]);

  const openQuiz = async (quizId: string) => {
    setQuizLoading(true);
    setEditMode(false);
    setEditing(null);
    try {
      const res = await fetch(`${backendUrl}/api/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedQuiz(data);
        setEditing(JSON.parse(JSON.stringify(data)));
      } else {
        setSnackbar({ msg: "Failed to load quiz", severity: "error" });
      }
    } catch {
      setSnackbar({ msg: "Failed to load quiz", severity: "error" });
    } finally {
      setQuizLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedQuiz(null);
    setEditing(null);
    setEditMode(false);
  };

  const handleEdit = () => {
    if (!selectedQuiz) return;
    setEditing(JSON.parse(JSON.stringify(selectedQuiz)));
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditing(JSON.parse(JSON.stringify(selectedQuiz)));
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!editing || !selectedQuiz?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/quizzes/${selectedQuiz.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        setSnackbar({ msg: "Quiz saved successfully", severity: "success" });
        setSelectedQuiz(JSON.parse(JSON.stringify(editing)));
        setEditMode(false);
        setQuizzes((prev) =>
          prev.map((q) =>
            q.id === selectedQuiz.id ? { ...editing, id: selectedQuiz.id } : q,
          ),
        );
      } else {
        const err = await res.json().catch(() => ({}));
        setSnackbar({
          msg: `Save failed: ${err.error || res.statusText}`,
          severity: "error",
        });
      }
    } catch {
      setSnackbar({ msg: "Failed to save quiz", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuiz?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/quizzes/${selectedQuiz.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSnackbar({ msg: "Quiz deleted", severity: "success" });
        setQuizzes((prev) => prev.filter((q) => q.id !== selectedQuiz.id));
        setDeleteOpen(false);
        closeDetail();
      } else {
        setSnackbar({ msg: "Delete failed", severity: "error" });
      }
    } catch {
      setSnackbar({ msg: "Delete failed", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateQuizField = (field: keyof Quiz, value: any) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const updateItem = (index: number, field: string, value: any) => {
    if (!editing || !editing.quizItems) return;
    const items = [...editing.quizItems];
    const item = { ...items[index] };
    if (item.kind === "slide") {
      item.slide = { ...item.slide, [field]: value };
    } else if (item.kind === "question" && item.question) {
      item.question = { ...item.question, [field]: value };
    }
    items[index] = item;
    setEditing({ ...editing, quizItems: items });
  };

  const removeItem = (index: number) => {
    if (!editing || !editing.quizItems) return;
    const items = editing.quizItems.filter((_, i) => i !== index);
    setEditing({ ...editing, quizItems: items });
  };

  const addSlide = () => {
    if (!editing) return;
    const items = [...(editing.quizItems || [])];
    items.push({ kind: "slide", slide: { title: "", content: "" } });
    setEditing({ ...editing, quizItems: items });
  };

  const addQuestion = () => {
    if (!editing) return;
    const items = [...(editing.quizItems || [])];
    items.push({
      kind: "question",
      question: {
        question: "",
        points: 10,
        difficulty: 1,
        hint: "",
        explanation: "",
        type: {
          name: "multiple_choice" as const,
          description: "Multiple choice question",
          correctAnswer: "",
          incorrectAnswers: [],
          options: [],
        },
        category: [],
        correctAnswers: [],
        incorrectAnswers: [],
        options: [],
      },
    });
    setEditing({ ...editing, quizItems: items });
  };

  const isUcalgary = theme.palette.primary.main === "#d6001c";

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 80px)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 80px)",
          gap: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Not signed in
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/sign-in")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Sign in
        </Button>
      </Box>
    );
  }

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";
  const email = user.email ?? "No email";
  const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? "";
  const provider = user.app_metadata?.provider ?? "email";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "calc(100vh - 80px)",
        px: 2,
        py: 4,
        gap: 4,
      }}
    >
      {/* User Card */}
      <Card
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            height: 6,
            background: isUcalgary
              ? "linear-gradient(90deg, #d6001c 0%, #ffcd00 50%, #ff671f 100%)"
              : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        />
        <CardContent
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: theme.palette.primary.main,
              fontSize: "2rem",
              fontWeight: 700,
              mb: 1,
            }}
          >
            {email.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {name || "User"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
          <Divider sx={{ width: "100%", my: 1 }} />
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Provider
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, textTransform: "capitalize" }}
              >
                {provider}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Joined
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {createdAt}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                User ID
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.id}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => supabase.auth.signOut().then(() => navigate("/"))}
            sx={{
              mt: 2,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              py: 1.2,
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main,
              "&:hover": {
                borderColor: theme.palette.error.dark,
                bgcolor: "rgba(244,67,54,0.04)",
              },
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>

      {/* My Quizzes Section */}
      <Box sx={{ width: "100%", maxWidth: selectedQuiz ? 800 : 460 }}>
        {selectedQuiz ? (
          <>
            {/* Detail Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <IconButton onClick={closeDetail} size="small">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                {editMode ? "Edit Quiz" : selectedQuiz.quizName}
              </Typography>
              {!editMode && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteOpen(true)}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    Delete
                  </Button>
                </Box>
              )}
            </Box>

            {quizLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : editing ? (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                {/* Quiz Metadata */}
                <TextField
                  label="Quiz Name"
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  value={editing.quizName}
                  onChange={(e) => updateQuizField("quizName", e.target.value)}
                />
                <TextField
                  label="Description"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                  value={editing.quizDescription || ""}
                  onChange={(e) =>
                    updateQuizField("quizDescription", e.target.value)
                  }
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Created by: {editing.createdBy}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Items */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Quiz Items ({editing.quizItems?.length || 0})
                </Typography>

                {editing.quizItems?.map((item, i) => (
                  <Card
                    key={i}
                    variant="outlined"
                    sx={{ mb: 1.5, borderRadius: 2 }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Chip
                          icon={
                            item.kind === "slide" ? (
                              <SlideshowIcon />
                            ) : (
                              <HelpIcon />
                            )
                          }
                          label={`${item.kind} #${i + 1}`}
                          size="small"
                          color={item.kind === "slide" ? "info" : "primary"}
                          variant="outlined"
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeItem(i)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {item.kind === "slide" ? (
                        <>
                          <TextField
                            label="Title"
                            fullWidth
                            size="small"
                            sx={{ mb: 1 }}
                            value={item.slide?.title || ""}
                            onChange={(e) =>
                              updateItem(i, "title", e.target.value)
                            }
                          />
                          <TextField
                            label="Content"
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            value={item.slide?.content || ""}
                            onChange={(e) =>
                              updateItem(i, "content", e.target.value)
                            }
                          />
                        </>
                      ) : (
                        <>
                          <TextField
                            label="Question"
                            fullWidth
                            size="small"
                            sx={{ mb: 1 }}
                            value={item.question?.question || ""}
                            onChange={(e) =>
                              updateItem(i, "question", e.target.value)
                            }
                          />
                          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                            <TextField
                              label="Points"
                              type="number"
                              size="small"
                              sx={{ width: 100 }}
                              value={item.question?.points || 0}
                              onChange={(e) =>
                                updateItem(
                                  i,
                                  "points",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                            />
                            <TextField
                              label="Difficulty (1-5)"
                              type="number"
                              size="small"
                              sx={{ width: 140 }}
                              value={item.question?.difficulty || 1}
                              inputProps={{ min: 1, max: 5 }}
                              onChange={(e) =>
                                updateItem(
                                  i,
                                  "difficulty",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                            />
                          </Box>
                          <TextField
                            label="Hint"
                            fullWidth
                            size="small"
                            sx={{ mb: 1 }}
                            value={item.question?.hint || ""}
                            onChange={(e) =>
                              updateItem(i, "hint", e.target.value)
                            }
                          />
                          <TextField
                            label="Explanation"
                            fullWidth
                            size="small"
                            sx={{ mb: 1 }}
                            multiline
                            rows={2}
                            value={item.question?.explanation || ""}
                            onChange={(e) =>
                              updateItem(i, "explanation", e.target.value)
                            }
                          />
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              flexDirection: { xs: "column", sm: "row" },
                            }}
                          >
                            <TextField
                              label="Options (comma-separated)"
                              fullWidth
                              size="small"
                              value={(item.question?.options || []).join(", ")}
                              onChange={(e) =>
                                updateItem(
                                  i,
                                  "options",
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                )
                              }
                            />
                            <TextField
                              label="Correct Answers (comma-sep)"
                              fullWidth
                              size="small"
                              value={(item.question?.correctAnswers || []).join(
                                ", ",
                              )}
                              onChange={(e) =>
                                updateItem(
                                  i,
                                  "correctAnswers",
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                )
                              }
                            />
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mt: 1,
                              flexDirection: { xs: "column", sm: "row" },
                            }}
                          >
                            <TextField
                              label="Incorrect Answers (comma-sep)"
                              fullWidth
                              size="small"
                              value={(
                                item.question?.incorrectAnswers || []
                              ).join(", ")}
                              onChange={(e) =>
                                updateItem(
                                  i,
                                  "incorrectAnswers",
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                )
                              }
                            />
                            <TextField
                              label="Categories (comma-sep)"
                              fullWidth
                              size="small"
                              value={(item.question?.category || []).join(", ")}
                              onChange={(e) =>
                                updateItem(
                                  i,
                                  "category",
                                  e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                )
                              }
                            />
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SlideshowIcon />}
                    onClick={addSlide}
                  >
                    Add Slide
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<HelpIcon />}
                    onClick={addQuestion}
                  >
                    Add Question
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={saving}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Paper>
            ) : (
              /* Read-only detail view */
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {selectedQuiz.quizDescription || "No description"}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
                  <Typography variant="caption" color="text.secondary">
                    Created by: <strong>{selectedQuiz.createdBy}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Items:{" "}
                    <strong>{selectedQuiz.quizItems?.length || 0}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Questions:{" "}
                    <strong>
                      {selectedQuiz.quizItems?.filter(
                        (i) => i.kind === "question",
                      ).length || 0}
                    </strong>
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Items
                </Typography>
                {!selectedQuiz.quizItems ||
                selectedQuiz.quizItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No items in this quiz.
                  </Typography>
                ) : (
                  selectedQuiz.quizItems.map((item, i) => (
                    <Card
                      key={i}
                      variant="outlined"
                      sx={{ mb: 1, borderRadius: 2 }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Chip
                            icon={
                              item.kind === "slide" ? (
                                <SlideshowIcon />
                              ) : (
                                <HelpIcon />
                              )
                            }
                            label={`#${i + 1} - ${item.kind}`}
                            size="small"
                            color={item.kind === "slide" ? "info" : "primary"}
                            variant="outlined"
                          />
                        </Box>
                        {item.kind === "slide" ? (
                          <>
                            {item.slide?.title && (
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {item.slide.title}
                              </Typography>
                            )}
                            {item.slide?.content && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {item.slide.content}
                              </Typography>
                            )}
                          </>
                        ) : item.question ? (
                          <>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {item.question.question}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 2,
                                mt: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.question.points} pts
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Difficulty: {item.question.difficulty}
                              </Typography>
                              {item.question.options &&
                                item.question.options.length > 0 && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {item.question.options.length} options
                                  </Typography>
                                )}
                              {item.question.category &&
                                item.question.category.length > 0 && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Categories:{" "}
                                    {item.question.category.join(", ")}
                                  </Typography>
                                )}
                            </Box>
                            {item.question.options &&
                              item.question.options.length > 0 && (
                                <Box
                                  sx={{
                                    mt: 0.5,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.5,
                                  }}
                                >
                                  {item.question.options.map((opt, oi) => (
                                    <Chip
                                      key={oi}
                                      label={opt}
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 22, fontSize: "0.75rem" }}
                                    />
                                  ))}
                                </Box>
                              )}
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))
                )}
              </Paper>
            )}
          </>
        ) : (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              My Quizzes
            </Typography>
            {quizzesLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : quizzes.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No quizzes yet.{" "}
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate("/create-quiz")}
                  sx={{ textTransform: "none" }}
                >
                  Create your first quiz!
                </Button>
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {quizzes.map((quiz, index) => (
                  <Card
                    key={quiz.id ?? index}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      cursor: "pointer",
                      "&:hover": { borderColor: theme.palette.primary.main },
                    }}
                    onClick={() => quiz.id && openQuiz(quiz.id)}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {quiz.quizName}
                      </Typography>
                      {quiz.quizDescription && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {quiz.quizDescription}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        {
                          quiz.quizItems.filter((i) => i.kind === "question")
                            .length
                        }{" "}
                        question
                        {quiz.quizItems.filter((i) => i.kind === "question")
                          .length !== 1
                          ? "s"
                          : ""}
                        {" · "}
                        {quiz.quizItems.length} item
                        {quiz.quizItems.length !== 1 ? "s" : ""}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Quiz?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedQuiz?.quizName}"? This
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar?.msg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
