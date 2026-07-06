import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { homeworkAPI, BACKEND_API_URL, getHomeworkId, getHomeworkAnswerId } from '../api/api';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Slider,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Avatar,
  Stack,
  Rating,
  LinearProgress,
  Toolbar,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Send as SendIcon,
  Description as DescriptionIcon,
  Link as LinkIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';

const HomeworkCheckPanel = ({ groupId, homework, student, onClose, onUpdate }) => {
  const [loading, setLoading]           = useState(true);
  const [submissionData, setSubmissionData] = useState(null);
  const [score, setScore]               = useState(60);
  const [comment, setComment]           = useState('');
  const [teacherFile, setTeacherFile]   = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadingRef = useRef(false);
  const loadedRef  = useRef(false);

  console.log('🔵 HomeworkCheckPanel props:', { groupId, homework, student });

  const getStudentName = (s) =>
    s?.full_name ||
    `${s?.first_name || ''} ${s?.last_name || ''}`.trim() ||
    s?.name ||
    "O'quvchi";

  /* ── Load submission ── */
  useEffect(() => {
    // Agar student prop da homework_answer_id bo'lsa, fetchSubmissionData ga murojaat qilmaymiz
    const studentHomeworkAnswerId = 
      student?.homework_answer_id || 
      student?.answer_id || 
      student?.homeworkAnswerId ||
      null;

    if (studentHomeworkAnswerId) {
      console.log('✅ student prop da homework_answer_id topildi, API ga murojaat qilmaymiz');
      setSubmissionData(student);
      setScore(student?.score ?? student?.grade ?? 60);
      setComment(student?.comment || student?.teacher_comment || '');
      setLoading(false);
      loadedRef.current = true;
      return;
    }

    // Aks holda, API dan olishga harakat qilamiz
    if (!loadingRef.current && !loadedRef.current) fetchSubmissionData();
    return () => { loadingRef.current = false; loadedRef.current = false; };
  }, [student]);

  const fetchSubmissionData = async () => {
    if (loadingRef.current) return;

    // studentId ni barcha mumkin bo'lgan maydonlardan olish
    const studentId = student?.student_id ?? student?.id ?? student?.user_id ?? student?.studentId;

    const hwId = getHomeworkId(homework);

    console.log('📋 HomeworkCheckPanel props:', {
      groupId,
      homeworkId: hwId,
      studentId,
      student,
    });

    if (!groupId || !hwId || !studentId) {
      console.warn('⚠️ Kerakli ma\'lumotlar yo\'q:', { groupId, homeworkId: hwId, studentId });
      setLoading(false);
      return;
    }

    // Agar student obyektida allaqachon homework_answer_id bo'lsa, API ga murojaat qilmaymiz
    const studentHomeworkAnswerId = 
      student?.homework_answer_id || 
      student?.answer_id || 
      student?.homeworkAnswerId ||
      null;

    if (studentHomeworkAnswerId) {
      console.log('✅ student prop da homework_answer_id topildi:', studentHomeworkAnswerId);
      // student obyektidan to'g'ridan-to'g'ri submissionData yaratamiz
      setSubmissionData(student);
      setScore(student?.score ?? student?.grade ?? 60);
      setComment(student?.comment || student?.teacher_comment || '');
      setLoading(false);
      loadedRef.current = true;
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    try {
      // GET /group/{groupId}/homework/{homeworkId}/result/{studentId}
      const res = await homeworkAPI.getStudentResult(groupId, hwId, studentId);
      console.log('✅ getStudentResult response:', res.data);
      console.log('🔍 submissionData (to\'liq):', JSON.stringify(res.data?.data || res.data, null, 2));
      const data = res.data?.data || res.data;

      // DEBUG: homeworkAnswerId ni tekshirish
      console.log('🔍 DEBUG submissionData struktura:');
      console.log('🔍 submissionData top-level keys:', Object.keys(data || {}));
      console.log('🔍 submissionData.id:', data?.id);
      console.log('🔍 submissionData.homework_answer_id:', data?.homework_answer_id);
      console.log('🔍 submissionData.answer_id:', data?.answer_id);
      console.log('🔍 student object:', student);
      
      // homework_answer_id ni topish
      const foundAnswerId = data?.homework_answer_id || data?.answer_id || data?.id;
      console.log('🔍 Topilgan homework_answer_id:', foundAnswerId);
      
      // Agar data ichida answer_data yoki homework_answer bo'lsa
      if (data?.answer_data) {
        console.log('🔍 answer_data:', data.answer_data);
      }
      if (data?.homework_answer) {
        console.log('🔍 homework_answer:', data.homework_answer);
      }

      // data null yoki bo'sh — bo'sh forma ko'rsatamiz (topshirmagan bo'lsa ham tekshirish imkoni)
      if (!data || data === null) {
        console.log('📭 Talaba uy vazifasini topshirmagan (data null)');
        setSubmissionData({ student_id: studentId, status: 'PENDING' });
        loadedRef.current = true;
        return;
      }

      setSubmissionData(data);
      setScore(data?.score != null ? data.score : 60);
      setComment(data?.comment || data?.teacher_comment || '');
      loadedRef.current = true;
    } catch (err) {
      console.error('❌ getStudentResult xato:', {
        status: err.response?.status,
        data: err.response?.data,
        url: `/group/${groupId}/homework/${hwId}/result/${studentId}`,
      });
      // 404 — backend bu endpointni qo'llab-quvvatlamaydi yoki talaba topshirmagan
      // Lekin agar student prop da allaqachon ma'lumot bo'lsa, uni ishlatamiz
      if (err.response?.status === 404) {
        console.log('⚠️ getStudentResult 404 qaytardi, student prop dan foydalaniladi');
        // Student prop dan to'g'ridan-to'g'ri ishlatamiz
        setSubmissionData(student);
        setScore(student?.score ?? student?.grade ?? 60);
        setComment(student?.comment || student?.teacher_comment || '');
      } else {
        const errMsg = err.response?.data?.message || err.message || "Ma'lumotlarni yuklashda xato!";
        toast.error(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
        // Xato bo'lsa ham, student prop dan foydalanishga harakat qilamiz
        setSubmissionData(student);
      }
      loadedRef.current = true;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  /* ── Submit grade ── */
  const handleSubmit = async () => {
    if (score < 0 || score > 100) { toast.error("Ball 0 dan 100 gacha bo'lishi kerak!"); return; }

    const hwId = getHomeworkId(homework);
    if (!groupId || !hwId) {
      toast.error("Guruh yoki uy vazifa ID si topilmadi!");
      return;
    }

    // studentId ni olish
    const actualStudentId = student?.student_id ?? student?.id ?? student?.user_id ?? student?.studentId;
    
    // homework_answer_id ni submissionData va student dan olish - barcha mumkin bo'lgan joylardan qidiramiz
    let homeworkAnswerId = null;
    
    console.log('🔍 FULL submissionData:', submissionData);
    console.log('🔍 FULL student:', student);
    console.log('🔍 submissionData type:', typeof submissionData);
    console.log('🔍 submissionData keys:', submissionData ? Object.keys(submissionData) : 'null');
    console.log('🔍 submissionData.id:', submissionData?.id);
    console.log('🔍 submissionData.homework_answer_id:', submissionData?.homework_answer_id);
    console.log('🔍 submissionData.answer_id:', submissionData?.answer_id);
    console.log('🔍 student.homework_answer_id:', student?.homework_answer_id);
    console.log('🔍 student.answer_id:', student?.answer_id);
    console.log('🔍 student.id:', student?.id);
    console.log('🔍 student.student_id:', student?.student_id);
    
    // ❌ Agar status NOT_SENT bo'lsa, talaba uy vazifasini topshirmagan
    if (submissionData?.status === 'NOT_SENT') {
      console.log('⚠️ Talaba uy vazifasini topshirmagan (submissionData.status: NOT_SENT)');
      toast.error(
        'Talaba uy vazifasini topshirmagan. Iltimos, talaba avval uy vazifasini topshirsin.',
        { duration: 8000 }
      );
      return;
    }
    
    // Agar student.status PENDING yoki ACCEPTED/REJECTED bo'lsa, topshirgan degani
    // Lekin homework_answer_id topilmasa, boshqa joylardan qidiramiz
    if ((student?.status === 'PENDING' || student?.status === 'ACCEPTED' || student?.status === 'REJECTED') && student?.submitted_at) {
      console.log('✅ student.status:', student.status, ', submitted_at:', student.submitted_at);
      console.log('⚠️ homework_answer_id hali topilmadi, boshqa joylardan qidiramiz');
      // homeworkAnswerId ni null qilmaymiz, pastda qidirishda davom etamiz
    }
    
    // 1. Student prop dan (HomeworkResultsPanel dan kelgan)
    homeworkAnswerId = 
      student?.homework_answer_id ||
      student?.answer_id ||
      student?.homeworkAnswerId ||
      student?.answerId ||
      null;
    
    // 2. submissionData dan
    if (!homeworkAnswerId) {
      homeworkAnswerId = 
        submissionData?.homework_answer_id ||
        submissionData?.answer_id ||
        submissionData?.homeworkAnswerId ||
        submissionData?.answerId ||
        null;
    }
    
    // 3. Agar array ichida bo'lsa (ba'zi backendlar array qaytaradi)
    if (!homeworkAnswerId && Array.isArray(submissionData)) {
      console.log('🔍 submissionData array, birinchi element:', submissionData[0]);
      homeworkAnswerId = submissionData[0]?.homework_answer_id || 
                        submissionData[0]?.answer_id || 
                        submissionData[0]?.id;
    }
    
    // 4. Agar nested object ichida bo'lsa
    if (!homeworkAnswerId) {
      homeworkAnswerId = 
        submissionData?.data?.homework_answer_id ||
        submissionData?.data?.answer_id ||
        submissionData?.data?.id ||
        submissionData?.answer?.id ||
        submissionData?.homework_answer?.id ||
        student?.data?.homework_answer_id ||
        student?.data?.answer_id ||
        null;
    }
    
    // 5. Oxirgi variant - submissionData.id yoki student.id (lekin bu student_id bilan aralashmasligi kerak)
    if (!homeworkAnswerId && submissionData?.id) {
      console.log('🔍 Checking submissionData.id:', submissionData.id, 'vs actualStudentId:', actualStudentId);
      // submissionData.id ni faqat u student_id dan farq qilsa ishlatamiz
      if (submissionData.id !== actualStudentId && submissionData.id !== student?.id && submissionData.id !== student?.student_id) {
        homeworkAnswerId = submissionData.id;
        console.log('✅ Using submissionData.id as homework_answer_id:', homeworkAnswerId);
      } else {
        console.log('⚠️ submissionData.id is same as student_id, skipping');
      }
    }

    console.log('🔍 Debug malumotlari:', {
      groupId,
      hwId,
      actualStudentId,
      homeworkAnswerId,
      submissionDataKeys: Object.keys(submissionData || {}),
      studentKeys: Object.keys(student || {}),
      submissionData,
      student
    });
    
    // ✅ Agar homework_answer_id topilmasa, bu backend API uni talab qilmaydi degan gap
    // Student topshirgan bo'lsa (status PENDING/ACCEPTED/REJECTED), student_id yetarli
    if (!homeworkAnswerId && (student?.status === 'PENDING' || student?.status === 'ACCEPTED' || student?.status === 'REJECTED') && student?.submitted_at) {
      console.log('⚠️ homework_answer_id topilmadi, lekin talaba topshirgan.');
      console.log('✅ Backend API student_id bilan ishlashi kerak, homework_answer_id ni yubormayamiz.');
      // homeworkAnswerId null qoladi, payloadda yubormaymiz
    }
    
    // ❌ Agar homework_answer_id topilmasa VA talaba topshirmagan bo'lsa
    if (!homeworkAnswerId && !student?.submitted_at) {
      console.error('❌ homework_answer_id topilmadi va talaba topshirmagan');
      toast.error(
        'Talaba uy vazifasini topshirmagan. Iltimos, talaba avval uy vazifasini topshirsin.',
        { duration: 8000 }
      );
      return;
    }
    
    // title — backend "string" talab qiladi
    const titleValue = comment.trim() ||
      homework?.title ||
      homework?.topic ||
      homework?.lesson?.topic ||
      'Baholandi';

    setIsSubmitting(true);

    try {
      // Backend quyidagi majburiy maydonlarni kutadi
      const payload = {
        grade: Number(score),
        title: String(titleValue),
        student_id: Number(actualStudentId)
      };
      
      // homework_answer_id ni faqat mavjud bo'lsa qo'shamiz
      if (homeworkAnswerId && Number(homeworkAnswerId) > 0) {
        payload.homework_answer_id = Number(homeworkAnswerId);
      }

      let finalPayload = payload;

      if (teacherFile) {
        finalPayload = new FormData();
        finalPayload.append('grade', String(Number(score)));
        finalPayload.append('title', String(titleValue));
        finalPayload.append('student_id', String(Number(actualStudentId)));
        if (homeworkAnswerId && Number(homeworkAnswerId) > 0) {
          finalPayload.append('homework_answer_id', String(Number(homeworkAnswerId)));
        }
        finalPayload.append('file', teacherFile);
      }

      console.log('📤 API ga yuborilyapti (to\'liq payload):', { 
        url: `/group/${groupId}/homework/${hwId}/check`, 
        method: 'POST',
        payload: teacherFile ? {
          homework_answer_id: homeworkAnswerId || 'null',
          grade: score,
          title: titleValue,
          student_id: actualStudentId,
          file: teacherFile.name
        } : payload,
        hwId,
        groupId
      });

      const response = await homeworkAPI.check(groupId, hwId, finalPayload);
      console.log('✅ API javobi:', response.data);

      const isAccepted = Number(score) >= 60;
      toast.success(isAccepted ? '✅ Vazifa qabul qilindi!' : '❌ Vazifa qaytarildi!');
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error('❌ check xato:', err.response?.status, err.response?.data);
      console.error('❌ check xato full error:', err);
      
      // Batafsil xatolik ma'lumotlari
      const errorData = err.response?.data || {};
      const rawMsg = errorData?.message || errorData?.error || err.message;
      const errors = errorData?.errors || errorData?.validationErrors || errorData?.details;
      
      console.log('❌ Xatolik tafsilotlari:', {
        status: err.response?.status,
        data: errorData,
        rawMsg,
        errors,
        sentPayload: { grade: score, title: titleValue, student_id: actualStudentId, homework_answer_id: homeworkAnswerId }
      });

      if (err.response?.status === 400) {
        // 400 xatosida backend validation xatosini ko'rsatamiz
        let errorMessage = "Noto'g'ri ma'lumot yuborildi!";
        
        console.log('🔴 Backend 400 xatosi:', {
          rawMsg,
          errors,
          rawMsgType: typeof rawMsg,
          rawMsgIsArray: Array.isArray(rawMsg),
          rawMsgContent: Array.isArray(rawMsg) ? rawMsg : rawMsg
        });
        
        if (errors) {
          if (Array.isArray(errors)) {
            errorMessage = errors.join('\n');
          } else if (typeof errors === 'object') {
            errorMessage = Object.entries(errors)
              .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
              .join('\n');
          }
        } else if (rawMsg) {
          errorMessage = Array.isArray(rawMsg) ? rawMsg.join('\n') : String(rawMsg);
        }
        
        toast.error(errorMessage, { duration: 10000 });
        return;
      }
      if (err.response?.status === 403) {
        toast.error("Sizda bu amalni bajarish uchun ruxsat yo'q!");
        return;
      }
      if (err.response?.status === 404) {
        toast.error("Uy vazifa yoki talaba topilmadi!");
        return;
      }
      if (err.response?.status === 422) {
        const validationMsg = errors 
          ? (Array.isArray(errors) ? errors.join('\n') : JSON.stringify(errors, null, 2))
          : rawMsg;
        toast.error(Array.isArray(rawMsg) ? rawMsg.join('\n') : String(validationMsg || 'Validation xatosi!'));
        return;
      }
      if (err.response?.status === 500) {
        console.error('❌ Server 500 xatosi tafsilotlari:', errorData);
        const serverError = rawMsg || errorData?.details || 'Server xatosi!';
        toast.error(`Server xatosi: ${serverError}`, { duration: 10000 });
        return;
      }
      toast.error(Array.isArray(rawMsg) ? rawMsg.join('\n') : String(rawMsg || err.message || 'Xato yuz berdi!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="400px"
        gap={3}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#10b981' }} />
        <Typography variant="body1" color="text.secondary">
          Yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  /* ── Computed values ── */
  const studentName = getStudentName(student) || submissionData?.student?.full_name || 'Oʻquvchi';

  const files = submissionData?.files || submissionData?.attachments ||
                submissionData?.answer_files ||
                (submissionData?.file ? [submissionData.file] : []);
  const filesArray = Array.isArray(files) ? files : [];
  const filesCount = filesArray.length;

  const submittedAt = submissionData?.submitted_at || submissionData?.created_at ||
                      submissionData?.submittedAt  || submissionData?.createdAt;

  const homeworkLink = submissionData?.link || submissionData?.github_link ||
                       submissionData?.url  || submissionData?.answer_link;

  const homeworkDescription = homework?.description || homework?.title ||
                              homework?.topic || homework?.lesson?.topic || 'Uyga vazifa';

  const homeworkDeadline = homework?.deadline || homework?.due_date || homework?.deadline_at;

  const statusVal = submissionData?.status || 'PENDING';
  const statusLabel =
    statusVal === 'ACCEPTED' ? 'Qabul qilingan' :
    statusVal === 'REJECTED' ? 'Qaytarilgan'    : 'Kutayabti';
  const statusStyle =
    statusVal === 'ACCEPTED' ? { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' } :
    statusVal === 'REJECTED' ? { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' } :
                               { background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a' };

  const formatDate = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return '—';
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `${d.getDate()} ${m[d.getMonth()]}, ${d.getFullYear()} ${hh}:${mm}`;
  };

  const scoreColor = score >= 60 ? '#10b981' : '#ef4444';

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>

        {/* ═══ HEADER ═══ */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={onClose} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Uyga vazifa
          </Typography>
        </Box>

        {/* ═══ UY VAZIFASI CARD ═══ */}
        <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              {homeworkDescription}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626' }}>
                Uyga vazifa muddati: {formatDate(homeworkDeadline)}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626' }}>
                Fayllar soni: {filesCount}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* ═══ STUDENT CARD ═══ */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#10b981', fontSize: 24 }}>
                {studentName.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h4" sx={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>
                {studentName}
              </Typography>
            </Box>

            {/* Vaqti / Status */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 2.5, 
                borderRadius: 1,
                bgcolor: '#fff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                mb: 2
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                  Vaqti:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {formatDate(submittedAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                  Status:
                </Typography>
                <Chip 
                  label={statusLabel}
                  sx={{
                    ...statusStyle,
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                />
              </Box>
            </Paper>

            {/* Files + Link */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 2.5, 
                borderRadius: 1,
                bgcolor: '#fff',
                border: '1px solid #e2e8f0'
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 2 }}>
                Fayl: <strong style={{ color: '#0f172a' }}>{filesCount}</strong>
              </Typography>

              {/* Thumbnails */}
              {filesCount > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                  {filesArray.map((file, idx) => {
                    const fileName = file.name || file.filename || `File ${idx + 1}`;
                    let fileUrl = file.url || file.path || file.file_url || file.fileUrl;
                    if (fileUrl && !fileUrl.startsWith('http')) {
                      fileUrl = `${BACKEND_API_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                    }
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
                    return (
                      <Box
                        key={idx}
                        onClick={() => { if (fileUrl) window.open(fileUrl, '_blank'); }}
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid #e2e8f0',
                          bgcolor: '#f8fafc',
                          cursor: fileUrl ? 'pointer' : 'default',
                          flexShrink: 0,
                          transition: 'transform 0.15s',
                          '&:hover': {
                            transform: 'scale(1.04)'
                          }
                        }}
                      >
                        {isImage && fileUrl ? (
                          <img 
                            src={fileUrl} 
                            alt={fileName} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <Box sx={{
                            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            bgcolor: '#f1f5f9', gap: 0.5,
                          }}>
                            <AttachFileIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
                            <Typography variant="caption" sx={{ fontSize: '9px', color: '#64748b', textAlign: 'center', px: 0.5, wordBreak: 'break-all' }}>
                              {fileName.split('.').pop()?.toUpperCase()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Link / Izoh */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 1,
                bgcolor: '#f8fafc',
                borderLeft: '4px solid #3b82f6'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                  Uyga vazifa izohi:
                </Typography>
                {homeworkLink ? (
                  <Box 
                    component="a"
                    href={homeworkLink}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ 
                      fontSize: '14px', 
                      color: '#2563eb', 
                      fontWeight: 600, 
                      textDecoration: 'none', 
                      wordBreak: 'break-all',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    <LinkIcon fontSize="small" />
                    {homeworkLink}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Izoh yoki link kiritilmagan.
                  </Typography>
                )}
              </Box>
            </Paper>
          </CardContent>
        </Card>

        {/* ═══ INFO BOX ═══ */}
        <Alert 
          severity="info"
          icon={<InfoIcon />}
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            bgcolor: '#eff6ff',
            color: '#1d4ed8',
            '& .MuiAlert-icon': {
              color: '#3b82f6'
            }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
            60-100 oralig'ida ball qo'yilgan vazifa 'Qabul qilingan', 0-59 oralig'ida
            ball qo'yilgan vazifa 'Qaytarilgan' hisoblanadi.
          </Typography>
        </Alert>

        {/* ═══ BALL ═══ */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
          <CardHeader 
            title="Ball"
            titleTypographyProps={{ 
              fontSize: '18px', 
              fontWeight: 700,
              color: '#0f172a'
            }}
          />
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ flex: 1, position: 'relative', pb: 3 }}>
                <Slider
                  value={score}
                  onChange={(e, value) => setScore(value)}
                  min={0}
                  max={100}
                  sx={{
                    color: scoreColor,
                    height: 8,
                    '& .MuiSlider-thumb': {
                      width: 24,
                      height: 24,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    },
                    '& .MuiSlider-track': {
                      height: 8,
                      borderRadius: 4,
                    },
                    '& .MuiSlider-rail': {
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#e2e8f0',
                    },
                  }}
                />
                {/* O'tish bali marker at 60% */}
                <Box sx={{
                  position: 'absolute', left: '60%', top: 6,
                  transform: 'translateX(-50%)',
                  width: '2px', height: 20, bgcolor: '#cbd5e1',
                }} />
                <Typography 
                  variant="caption" 
                  sx={{
                    position: 'absolute', bottom: 0, left: '60%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap',
                  }}
                >
                  O'tish bali
                </Typography>
              </Box>
              <TextField
                type="number"
                value={score}
                onChange={(e) => setScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                inputProps={{ min: 0, max: 100 }}
                sx={{
                  width: 80,
                  '& .MuiOutlinedInput-input': {
                    fontSize: '18px',
                    fontWeight: 700,
                    color: scoreColor,
                    textAlign: 'center',
                  }
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* ═══ FAYLLAR (Teacher uploads) ═══ */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
          <CardHeader 
            title="Fayllar"
            titleTypographyProps={{ 
              fontSize: '18px', 
              fontWeight: 700,
              color: '#0f172a'
            }}
          />
          <CardContent>
            <Box
              onClick={() => document.getElementById('teacher-hw-file').click()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) setTeacherFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => e.preventDefault()}
              sx={{
                border: '2px dashed #10b981',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: '#f0fdf4',
                transition: 'background 0.15s',
                '&:hover': {
                  bgcolor: '#dcfce7'
                }
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
              <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500, mb: 0.5 }}>
                Faylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling
              </Typography>
              <Typography variant="body2" color="text.secondary">
                .jpg, .png, .pdf, .mp4, .docs formatlaridan birida bo'lishi mumkin
              </Typography>
              <input
                id="teacher-hw-file" type="file" style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) setTeacherFile(e.target.files[0]); }}
              />
            </Box>

            {teacherFile && (
              <Box sx={{
                mt: 1.5, p: 1.5, bgcolor: '#dcfce7',
                borderRadius: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', border: '1px solid #bbf7d0',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFileIcon sx={{ color: '#166534', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#166534', fontWeight: 500 }}>
                    {teacherFile.name}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setTeacherFile(null); }}
                  sx={{ color: '#166534' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ═══ IZOH TEXTAREA ═══ */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
          <CardHeader 
            title="Izoh"
            titleTypographyProps={{ 
              fontSize: '18px', 
              fontWeight: 700,
              color: '#0f172a'
            }}
          />
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Izohingizni yozing..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f8fafc',
                  '&:hover fieldset': {
                    borderColor: '#10b981',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#10b981',
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* ═══ ACTION BUTTONS ═══ */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isSubmitting}
            sx={{
              px: 4,
              py: 1.5,
              borderColor: '#e2e8f0',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '15px',
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#f8fafc'
              }
            }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{
              px: 5,
              py: 1.5,
              bgcolor: isSubmitting ? '#6ee7b7' : '#10b981',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              '&:hover': {
                bgcolor: isSubmitting ? '#6ee7b7' : '#059669',
              },
              '&:disabled': {
                bgcolor: '#6ee7b7',
              }
            }}
          >
            {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
          </Button>
        </Box>

      </Box>
    </Box>
  );
};

export default HomeworkCheckPanel;
