import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ConfirmProvider } from './components/ConfirmProvider';
import { Toaster } from 'react-hot-toast';

// AUTH
import Login from './pages/Login';

// COMMON
import Layout from './components/Layout';

// DEFAULT USER (as you had)
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import GroupLesson from './pages/GroupLesson';
import Lessons from './pages/Lessons';
import LessonDetail from './pages/LessonDetail';
import HomeworkSubmit from './pages/HomeworkSubmit';
import HomeworkOwn from './pages/HomeworkOwn';
import HomeworkAll from './pages/HomeworkAll';
import HomeworkAccepted from './pages/HomeworkAccepted';
import Courses from './pages/Courses';
import Rooms from './pages/Rooms';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Gifts from './pages/Gifts';
import Management from './pages/Management';
import Profile from './pages/Profile';

// SUPER ADMIN 2 (TEACHER)
import TeacherDashboard from "./pages/SUPER ADMIN 2/TeacherDashboard";
import TeacherGroups from "./pages/SUPER ADMIN 2/TeacherGroups";
import TeacherGroupDetails from "./pages/SUPER ADMIN 2/TeacherGroupDetails";
import TeacherManagement from "./pages/SUPER ADMIN 2/TeacherManagement";
import TeacherProfile from "./pages/SUPER ADMIN 2/TeacherProfile";
import TeacherCourses from "./pages/SUPER ADMIN 2/TeacherCourses";
import TeacherRooms from "./pages/SUPER ADMIN 2/TeacherRooms";
import TeacherStudents from "./pages/SUPER ADMIN 2/TeacherStudents";
import TeacherGroupLesson from "./pages/SUPER ADMIN 2/TeacherGroupLesson";
import TeacherHomeworkSubmit from "./pages/SUPER ADMIN 2/TeacherHomeworkSubmit";
import TeacherHomeworkOwn from "./pages/SUPER ADMIN 2/TeacherHomeworkOwn";
import TeacherHomeworkAll from "./pages/SUPER ADMIN 2/TeacherHomeworkAll";
import TeacherHomeworkAccepted from "./pages/SUPER ADMIN 2/TeacherHomeworkAccepted";
import TeacherGifts from "./pages/SUPER ADMIN 2/TeacherGifts";
import TeacherLessons from "./pages/SUPER ADMIN 2/TeacherLessons";
import TeacherLessonDetail from "./pages/SUPER ADMIN 2/TeacherLessonDetail";

function App() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Toaster position="top-right" />

          <Routes>

            {/* ROOT */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />

            {/* DEFAULT TEACHER NAV */}
            <Route path="/teacher-dashboard" element={<Navigate to="/super-admin-2/dashboard" replace />} />

            {/* SUPER ADMIN 2 ROUTES */}
            <Route element={<Layout />}>
              <Route path="/super-admin-2/dashboard" element={<Navigate to="/super-admin-2/groups" replace />} />
              <Route path="/super-admin-2/groups" element={<TeacherGroups />} />
              <Route path="/super-admin-2/groups/:id" element={<GroupDetails />} />
              <Route path="/super-admin-2/groups/:id/homework/:homeworkId" element={<GroupDetails />} />
              <Route path="/super-admin-2/groups/:id/homework/:homeworkId/results" element={<GroupDetails />} />
              <Route path="/super-admin-2/groups/:id/lesson" element={<TeacherGroupLesson />} />
              <Route path="/super-admin-2/groups/:groupId/lessons" element={<TeacherLessons />} />
              <Route path="/super-admin-2/groups/:groupId/lessons/:lessonId" element={<TeacherLessonDetail />} />
              <Route path="/super-admin-2/lessons/:id" element={<TeacherLessonDetail />} />
              <Route path="/super-admin-2/homework/:homeworkId/submit" element={<TeacherHomeworkSubmit />} />
              <Route path="/super-admin-2/lesson/:lessonId/homework" element={<TeacherHomeworkOwn />} />
              <Route path="/super-admin-2/courses" element={<TeacherCourses />} />
              <Route path="/super-admin-2/rooms" element={<TeacherRooms />} />
              <Route path="/super-admin-2/students" element={<TeacherStudents />} />
              <Route path="/super-admin-2/gifts" element={<TeacherGifts />} />
              <Route path="/super-admin-2/homework" element={<TeacherHomeworkAll />} />
              <Route path="/super-admin-2/homework-results" element={<TeacherHomeworkAccepted />} />
              <Route path="/super-admin-2/management" element={<TeacherManagement />} />
              <Route path="/super-admin-2/profile" element={<TeacherProfile />} />
            </Route>

            {/* DEFAULT USER ROUTES */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetails />} />
              <Route path="/groups/:id/homework/:homeworkId" element={<GroupDetails />} />
              <Route path="/groups/:id/homework/:homeworkId/results" element={<GroupDetails />} />
              <Route path="/groups/:id/lesson" element={<GroupLesson />} />
              <Route path="/groups/:groupId/lessons" element={<Lessons />} />
              <Route path="/groups/:groupId/lessons/:lessonId" element={<LessonDetail />} />
              <Route path="/lessons/:id" element={<LessonDetail />} />
              <Route path="/homework/:homeworkId/submit" element={<HomeworkSubmit />} />
              <Route path="/lesson/:lessonId/homework" element={<HomeworkOwn />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/students" element={<Students />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/gifts" element={<Gifts />} />
              <Route path="/homework" element={<HomeworkAll />} />
              <Route path="/homework-results" element={<HomeworkAccepted />} />
              <Route path="/management" element={<Management />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </AppProvider>
  );
}

export default App;