import { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

// ============================================
// 🌐 TARJIMALAR
// ============================================
export const translations = {
  uz: {
    // Navbar
    search: "Qidirish...",
    add: "+ Qo'shish",
    langName: "O'zbekcha",
    // Sidebar
    home: "Asosiy",
    teachers: "O'qituvchilar",
    groups: "Guruhlar",
    students: "Talabalar",
    gifts: "Sovg'alar",
    management: "Boshqarish",
    logout: "Chiqish",
    subscription: "Obuna",
    subscriptionExpired: "Obunangiz tugagan",
    renewSubscription: "Obunani yangilash",
    // Pages
    dashboard: "Asosiy",
    welcome: "NajotEdu platformasiga xush kelibsiz!",
    activeStudents: "Faol talabalar",
    groupsCount: "Guruhlar",
    monthlyPayments: "Joriy oy to'lovlar",
    debtors: "Qarzdorlar",
    frozen: "Muzlatilganlar",
    archived: "Arxivdagilar",
    // Groups
    groupsTitle: "Guruhlar",
    groupsSubtitle: "Barcha guruhlar ro'yxati va ularni boshqarish.",
    addGroup: "+ Guruh qo'shish",
    archive: "Arxiv",
    status: "Status",
    groupName: "Guruh nomi",
    course: "Kurs",
    startDate: "Boshlanish",
    time: "Vaqt",
    room: "Xona",
    teacher: "O'qituvchi",
    maxStudents: "Max talaba",
    active: "FAOL",
    inactive: "FAOL EMAS",
    loading: "Yuklanmoqda...",
    noGroups: "Guruhlar yo'q",
    noArchive: "Arxivda guruhlar yo'q",
    // Teachers
    teachersTitle: "O'qituvchilar",
    teachersSubtitle: "Ushbu sahifada o'qituvchilar ro'yxati va ularning ma'lumotlari keltirilgan.",
    addTeacher: "+ O'qituvchi qo'shish",
    refresh: "Yangilash",
    filters: "Filters",
    mainList: "Asosiy ro'yxat",
    name: "NOMI",
    phone: "TELEFON",
    email: "EMAIL",
    address: "MANZIL",
    actions: "AMALLAR",
    noTeachers: "O'qituvchilar yo'q",
    notFound: "Natija topilmadi",
    view: "Ko'rish",
    delete: "O'chirish",
    edit: "Tahrirlash",
    confirmDelete: "O'chirishni tasdiqlaysizmi?",
    editTeacher: "O'qituvchini tahrirlash",
    addTeacherModal: "O'qituvchi qo'shish",
    fullName: "To'liq ism",
    phoneNumber: "Telefon raqam",
    emailField: "Email",
    addressField: "Manzil",
    password: "Parol",
    optional: "ixtiyoriy",
    required: "majburiy",
    phoneFormat: "9 ta raqam kiriting: 901234567 (998 siz)",
    phoneError: "Telefon raqam 9 ta raqamdan iborat bo'lishi kerak! Misol: 901234567",
    namePhoneRequired: "Ism va telefon majburiy!",
    namePhonePassRequired: "Ism, telefon va parol majburiy!",
    passwordPlaceholder: "Kamida 8 belgi",
    newPasswordPlaceholder: "Yangi parol (ixtiyoriy)",
    passwordHint: "Agar o'zgartirmoqchi bo'lmasangiz bo'sh qoldiring",
    passwordExample: "Misol: Admin123!",
    addToGroups: "Guruhlarga qo'shish",
    selectGroup: "Kamida bitta guruh tanlang!",
    groupsSelected: "ta guruh tanlandi!",
    addedToGroups: "ta guruhga qo'shildi!",
    addToGroupError: "Guruhga qo'shishda xato!",
    cancel: "Bekor qilish",
    save: "Saqlash",
    saving: "Saqlanmoqda...",
    teacherAdded: "O'qituvchi muvaffaqiyatli qo'shildi!",
    teacherUpdated: "O'qituvchi muvaffaqiyatli yangilandi!",
    teacherDeleted: "O'qituvchi o'chirildi!",
    loadError: "O'qituvchilarni yuklashda xato!",
    deleteError: "O'chirishda xato!",
    viewInfo: "O'qituvchi ma'lumotlari",
    phoneNumberLabel: "Telefon raqam",
    emailLabel: "Email manzil",
    addressLabel: "Yashash manzili",
    notEntered: "Kiritilmagan",
    unknown: "Noma'lum",
    archivedStatus: "Arxivlangan",
    activeStatus: "Aktiv",
    close: "Yopish",
    activeGroups: "Faol guruhlar",
    noActiveGroups: "Faol guruhlar topilmadi",
    // Dashboard
    hello: "Salom",
    welcomeTo: "NajotEdu platformasiga xush kelibsiz!",
    currentMonthPayments: "Joriy oy uchun to'lovlar",
    annualProfit: "Yillik Foyda",
    schedule: "Dars jadvali",
    // Sidebar submenu
    menu: "Menu",
    courses: "Kurslar",
    rooms: "Xonalar",
    staff: "Hodimlar",
    coin: "Coin",
    sendMessage: "Xabar Yuborish",
    // Login
    loginSystem: "O'QUV BOSHQARUV TIZIMI",
    phoneNumberLabelLogin: "Telefon raqam",
    passwordLabelLogin: "Parol",
    enterPassword: "Parolni kiriting",
    phoneExample: "Misol: 975661099 yoki 998975661099",
    loggingIn: "Kirmoqda...",
    loginButton: "Kirish",
    enterPhonePassword: "Telefon raqam va parolni kiriting!",
    loginSuccess: "Muvaffaqiyatli tizimga kirdingiz!",
    loginError: "Login yoki parol xato!",
    copyright: "Copyright © 2025 NajotEdu Ta'lim Markazi. Barcha huquqlar himoyalangan.",
    // Groups additional
    groupsTab: "Guruhlar",
    edit: "Tahrirlash",
    deleteGroup: "O'chirish",
    confirmDeleteGroup: "Guruhni o'chirishni tasdiqlaysizmi?",
    groupDeleted: "Guruh o'chirildi!",
    deleteGroupError: "O'chirishda xato!",
    groupActivated: "Guruh faollashtirildi!",
    groupDeactivated: "Guruh nofaol qilindi!",
    statusChangeError: "Holatni o'zgartirishda xato!",
    fillRequiredFields: "Barcha majburiy maydonlarni to'ldiring!",
    selectLessonDay: "Kamida bitta dars kuni tanlang!",
    selectTeacher: "Kamida bitta o'qituvchi tanlang!",
    groupUpdated: "Guruh muvaffaqiyatli yangilandi!",
    groupAdded: "Guruh muvaffaqiyatli qo'shildi!",
    errorOccurred: "Xato yuz berdi!",
    refreshGroups: "Yangilash",
    studentAddedToGroup: "guruhga qo'shildi!",
    addToGroupError: "Qo'shishda xato!",
    studentsLoadError: "Talabalarni yuklashda xato!",
    selectStudents: "Talabalarni tanlang",
    noStudentsSelected: "Talabalar tanlanmagan",
    studentPickerTitle: "Talabalarni tanlash",
    searchStudents: "Talabalarni qidirish",
    addStudentToGroup: "Guruhga talaba qo'shish",
    // Students page
    studentsTitle: "Talabalar",
    studentsSubtitle: "Talabalar ro'yxati va ma'lumotlari.",
    addStudent: "+ Talaba qo'shish",
    studentName: "ISM",
    studentPhone: "TELEFON",
    studentParentPhone: "OTA-ONASI TELEFONI",
    studentAddress: "MANZIL",
    noStudents: "Talabalar yo'q",
    studentAdded: "Talaba muvaffaqiyatli qo'shildi!",
    studentUpdated: "Talaba muvaffaqiyatli yangilandi!",
    studentDeleted: "Talaba o'chirildi!",
    confirmDeleteStudent: "Talabani o'chirishni tasdiqlaysizmi?",
    editStudent: "Talabani tahrirlash",
    addStudentModal: "Talaba qo'shish",
    // Management page
    managementTitle: "Boshqarish",
    coursesTab: "Kurslar",
    roomsTab: "Xonalar",
    addCourse: "+ Kurs qo'shish",
    addRoom: "+ Xona qo'shish",
    courseName: "Kurs nomi",
    roomName: "Xona nomi",
    roomCapacity: "Sig'im",
    noCourses: "Kurslar yo'q",
    noRooms: "Xonalar yo'q",
    courseAdded: "Kurs muvaffaqiyatli qo'shildi!",
    roomAdded: "Xona muvaffaqiyatli qo'shildi!",
    // Image upload
    photo: "Surati",
    clickToUpload: "Fayl yuklash uchun ustiga bosing yoki shu yerga sudrab olib keling",
    fileFormat: "JPG yoki PNG (maks. 2 MB)",
    maxSizeError: "Rasm hajmi 2MB dan oshmasligi kerak!",
    photoOptional: "(ixtiyoriy)",
  },
  ru: {
    search: "Поиск...",
    add: "+ Добавить",
    langName: "Русский",
    home: "Главная",
    teachers: "Учителя",
    groups: "Группы",
    students: "Студенты",
    gifts: "Подарки",
    management: "Управление",
    logout: "Выйти",
    subscription: "Подписка",
    subscriptionExpired: "Ваша подписка истекла",
    renewSubscription: "Обновить подписку",
    dashboard: "Главная",
    welcome: "Добро пожаловать на платформу NajotEdu!",
    activeStudents: "Активные студенты",
    groupsCount: "Группы",
    monthlyPayments: "Платежи текущего месяца",
    debtors: "Должники",
    frozen: "Замороженные",
    archived: "В архиве",
    groupsTitle: "Группы",
    groupsSubtitle: "Список всех групп и управление ими.",
    addGroup: "+ Добавить группу",
    archive: "Архив",
    status: "Статус",
    groupName: "Название группы",
    course: "Курс",
    startDate: "Начало",
    time: "Время",
    room: "Комната",
    teacher: "Учитель",
    maxStudents: "Макс. студентов",
    active: "АКТИВНА",
    inactive: "НЕ АКТИВНА",
    loading: "Загрузка...",
    noGroups: "Нет групп",
    noArchive: "В архиве нет групп",
    // Teachers
    teachersTitle: "Учителя",
    teachersSubtitle: "На этой странице представлен список учителей и их информация.",
    addTeacher: "+ Добавить учителя",
    refresh: "Обновить",
    filters: "Фильтры",
    mainList: "Основной список",
    name: "ИМЯ",
    phone: "ТЕЛЕФОН",
    email: "EMAIL",
    address: "АДРЕС",
    actions: "ДЕЙСТВИЯ",
    noTeachers: "Нет учителей",
    notFound: "Результат не найден",
    view: "Просмотр",
    delete: "Удалить",
    edit: "Редактировать",
    confirmDelete: "Подтвердить удаление?",
    editTeacher: "Редактировать учителя",
    addTeacherModal: "Добавить учителя",
    fullName: "Полное имя",
    phoneNumber: "Номер телефона",
    emailField: "Email",
    addressField: "Адрес",
    password: "Пароль",
    optional: "опционально",
    required: "обязательно",
    phoneFormat: "Введите 9 цифр: 901234567 (без 998)",
    phoneError: "Номер телефона должен состоять из 9 цифр! Пример: 901234567",
    namePhoneRequired: "Имя и телефон обязательны!",
    namePhonePassRequired: "Имя, телефон и пароль обязательны!",
    passwordPlaceholder: "Минимум 8 символов",
    newPasswordPlaceholder: "Новый пароль (опционально)",
    passwordHint: "Оставьте пустым, если не хотите менять",
    passwordExample: "Пример: Admin123!",
    addToGroups: "Добавить в группы",
    selectGroup: "Выберите хотя бы одну группу!",
    groupsSelected: "групп выбрано!",
    addedToGroups: "групп добавлено!",
    addToGroupError: "Ошибка добавления в группу!",
    cancel: "Отмена",
    save: "Сохранить",
    saving: "Сохранение...",
    teacherAdded: "Учитель успешно добавлен!",
    teacherUpdated: "Учитель успешно обновлен!",
    teacherDeleted: "Учитель удален!",
    loadError: "Ошибка загрузки учителей!",
    deleteError: "Ошибка удаления!",
    viewInfo: "Информация об учителе",
    phoneNumberLabel: "Номер телефона",
    emailLabel: "Email адрес",
    addressLabel: "Адрес проживания",
    notEntered: "Не введено",
    unknown: "Неизвестно",
    archivedStatus: "В архиве",
    activeStatus: "Активен",
    close: "Закрыть",
    activeGroups: "Активные группы",
    noActiveGroups: "Активные группы не найдены",
    // Dashboard
    hello: "Здравствуйте",
    welcomeTo: "Добро пожаловать на платформу NajotEdu!",
    currentMonthPayments: "Платежи за текущий месяц",
    annualProfit: "Годовая прибыль",
    schedule: "Расписание занятий",
    // Sidebar submenu
    menu: "Меню",
    courses: "Курсы",
    rooms: "Комнаты",
    staff: "Сотрудники",
    coin: "Coin",
    sendMessage: "Отправить сообщение",
    // Login
    loginSystem: "СИСТЕМА УПРАВЛЕНИЯ ОБУЧЕНИЕМ",
    phoneNumberLabelLogin: "Номер телефона",
    passwordLabelLogin: "Пароль",
    enterPassword: "Введите пароль",
    phoneExample: "Пример: 975661099 или 998975661099",
    loggingIn: "Вход...",
    loginButton: "Войти",
    enterPhonePassword: "Введите номер телефона и пароль!",
    loginSuccess: "Вы успешно вошли в систему!",
    loginError: "Неверный логин или пароль!",
    copyright: "Copyright © 2025 NajotEdu Образовательный центр. Все права защищены.",
    // Groups additional
    groupsTab: "Группы",
    edit: "Редактировать",
    deleteGroup: "Удалить",
    confirmDeleteGroup: "Подтвердить удаление группы?",
    groupDeleted: "Группа удалена!",
    deleteGroupError: "Ошибка при удалении!",
    groupActivated: "Группа активирована!",
    groupDeactivated: "Группа деактивирована!",
    statusChangeError: "Ошибка при изменении статуса!",
    fillRequiredFields: "Заполните все обязательные поля!",
    selectLessonDay: "Выберите хотя бы один день занятий!",
    selectTeacher: "Выберите хотя бы одного учителя!",
    groupUpdated: "Группа успешно обновлена!",
    groupAdded: "Группа успешно добавлена!",
    errorOccurred: "Произошла ошибка!",
    refreshGroups: "Обновить",
    studentAddedToGroup: "добавлен в группу!",
    addToGroupError: "Ошибка при добавлении!",
    studentsLoadError: "Ошибка загрузки студентов!",
    selectStudents: "Выберите студентов",
    noStudentsSelected: "Студенты не выбраны",
    studentPickerTitle: "Выбор студентов",
    searchStudents: "Поиск студентов",
    addStudentToGroup: "Добавить студента в группу",
    // Students page
    studentsTitle: "Студенты",
    studentsSubtitle: "Список студентов и их информация.",
    addStudent: "+ Добавить студента",
    studentName: "ИМЯ",
    studentPhone: "ТЕЛЕФОН",
    studentParentPhone: "ТЕЛЕФОН РОДИТЕЛЕЙ",
    studentAddress: "АДРЕС",
    noStudents: "Нет студентов",
    studentAdded: "Студент успешно добавлен!",
    studentUpdated: "Студент успешно обновлен!",
    studentDeleted: "Студент удален!",
    confirmDeleteStudent: "Подтвердить удаление студента?",
    editStudent: "Редактировать студента",
    addStudentModal: "Добавить студента",
    // Management page
    managementTitle: "Управление",
    coursesTab: "Курсы",
    roomsTab: "Комнаты",
    addCourse: "+ Добавить курс",
    addRoom: "+ Добавить комнату",
    courseName: "Название курса",
    roomName: "Название комнаты",
    roomCapacity: "Вместимость",
    noCourses: "Нет курсов",
    noRooms: "Нет комнат",
    courseAdded: "Курс успешно добавлен!",
    roomAdded: "Комната успешно добавлена!",
    // Image upload
    photo: "Фото",
    clickToUpload: "Нажмите, чтобы загрузить или перетащите",
    fileFormat: "JPG или PNG (макс. 2 МБ)",
    maxSizeError: "Размер изображения не должен превышать 2МБ!",
    photoOptional: "(опционально)",
  },
  en: {
    search: "Search...",
    add: "+ Add",
    langName: "English",
    home: "Home",
    teachers: "Teachers",
    groups: "Groups",
    students: "Students",
    gifts: "Gifts",
    management: "Management",
    logout: "Logout",
    subscription: "Subscription",
    subscriptionExpired: "Your subscription has expired",
    renewSubscription: "Renew subscription",
    dashboard: "Dashboard",
    welcome: "Welcome to NajotEdu platform!",
    activeStudents: "Active students",
    groupsCount: "Groups",
    monthlyPayments: "Monthly payments",
    debtors: "Debtors",
    frozen: "Frozen",
    archived: "Archived",
    groupsTitle: "Groups",
    groupsSubtitle: "All groups list and management.",
    addGroup: "+ Add group",
    archive: "Archive",
    status: "Status",
    groupName: "Group name",
    course: "Course",
    startDate: "Start date",
    time: "Time",
    room: "Room",
    teacher: "Teacher",
    maxStudents: "Max students",
    active: "ACTIVE",
    inactive: "INACTIVE",
    loading: "Loading...",
    noGroups: "No groups",
    noArchive: "No groups in archive",
    // Teachers
    teachersTitle: "Teachers",
    teachersSubtitle: "This page shows the list of teachers and their information.",
    addTeacher: "+ Add teacher",
    refresh: "Refresh",
    filters: "Filters",
    mainList: "Main list",
    name: "NAME",
    phone: "PHONE",
    email: "EMAIL",
    address: "ADDRESS",
    actions: "ACTIONS",
    noTeachers: "No teachers",
    notFound: "No results found",
    view: "View",
    delete: "Delete",
    edit: "Edit",
    confirmDelete: "Confirm deletion?",
    editTeacher: "Edit teacher",
    addTeacherModal: "Add teacher",
    fullName: "Full name",
    phoneNumber: "Phone number",
    emailField: "Email",
    addressField: "Address",
    password: "Password",
    optional: "optional",
    required: "required",
    phoneFormat: "Enter 9 digits: 901234567 (without 998)",
    phoneError: "Phone number must be 9 digits! Example: 901234567",
    namePhoneRequired: "Name and phone are required!",
    namePhonePassRequired: "Name, phone and password are required!",
    passwordPlaceholder: "Minimum 8 characters",
    newPasswordPlaceholder: "New password (optional)",
    passwordHint: "Leave empty if you don't want to change",
    passwordExample: "Example: Admin123!",
    addToGroups: "Add to groups",
    selectGroup: "Select at least one group!",
    groupsSelected: "groups selected!",
    addedToGroups: "groups added!",
    addToGroupError: "Error adding to group!",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    teacherAdded: "Teacher successfully added!",
    teacherUpdated: "Teacher successfully updated!",
    teacherDeleted: "Teacher deleted!",
    loadError: "Error loading teachers!",
    deleteError: "Error deleting!",
    viewInfo: "Teacher information",
    phoneNumberLabel: "Phone number",
    emailLabel: "Email address",
    addressLabel: "Address",
    notEntered: "Not entered",
    unknown: "Unknown",
    archivedStatus: "Archived",
    activeStatus: "Active",
    close: "Close",
    activeGroups: "Active groups",
    noActiveGroups: "No active groups found",
    // Dashboard
    hello: "Hello",
    welcomeTo: "Welcome to NajotEdu platform!",
    currentMonthPayments: "Current month payments",
    annualProfit: "Annual Profit",
    schedule: "Lesson schedule",
    // Sidebar submenu
    menu: "Menu",
    courses: "Courses",
    rooms: "Rooms",
    staff: "Staff",
    coin: "Coin",
    sendMessage: "Send Message",
    // Login
    loginSystem: "EDUCATION MANAGEMENT SYSTEM",
    phoneNumberLabelLogin: "Phone number",
    passwordLabelLogin: "Password",
    enterPassword: "Enter password",
    phoneExample: "Example: 975661099 or 998975661099",
    loggingIn: "Logging in...",
    loginButton: "Login",
    enterPhonePassword: "Enter phone number and password!",
    loginSuccess: "Successfully logged in to the system!",
    loginError: "Login or password is incorrect!",
    copyright: "Copyright © 2025 NajotEdu Education Center. All rights reserved.",
    // Groups additional
    groupsTab: "Groups",
    edit: "Edit",
    deleteGroup: "Delete",
    confirmDeleteGroup: "Confirm group deletion?",
    groupDeleted: "Group deleted!",
    deleteGroupError: "Error deleting!",
    groupActivated: "Group activated!",
    groupDeactivated: "Group deactivated!",
    statusChangeError: "Error changing status!",
    fillRequiredFields: "Fill all required fields!",
    selectLessonDay: "Select at least one lesson day!",
    selectTeacher: "Select at least one teacher!",
    groupUpdated: "Group successfully updated!",
    groupAdded: "Group successfully added!",
    errorOccurred: "An error occurred!",
    refreshGroups: "Refresh",
    studentAddedToGroup: "added to group!",
    addToGroupError: "Error adding!",
    studentsLoadError: "Error loading students!",
    selectStudents: "Select students",
    noStudentsSelected: "No students selected",
    studentPickerTitle: "Select students",
    searchStudents: "Search students",
    addStudentToGroup: "Add student to group",
    // Students page
    studentsTitle: "Students",
    studentsSubtitle: "Student list and information.",
    addStudent: "+ Add student",
    studentName: "NAME",
    studentPhone: "PHONE",
    studentParentPhone: "PARENT PHONE",
    studentAddress: "ADDRESS",
    noStudents: "No students",
    studentAdded: "Student successfully added!",
    studentUpdated: "Student successfully updated!",
    studentDeleted: "Student deleted!",
    confirmDeleteStudent: "Confirm student deletion?",
    editStudent: "Edit student",
    addStudentModal: "Add student",
    // Management page
    managementTitle: "Management",
    coursesTab: "Courses",
    roomsTab: "Rooms",
    addCourse: "+ Add course",
    addRoom: "+ Add room",
    courseName: "Course name",
    roomName: "Room name",
    roomCapacity: "Capacity",
    noCourses: "No courses",
    noRooms: "No rooms",
    courseAdded: "Course successfully added!",
    roomAdded: "Room successfully added!",
    // Image upload
    photo: "Photo",
    clickToUpload: "Click to upload or drag and drop",
    fileFormat: "JPG or PNG (max. 2 MB)",
    maxSizeError: "Image size must not exceed 2MB!",
    photoOptional: "(optional)",
  },
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { name: 'Abduxoshim Sultonqulov', photo: '' };
  });

  const [darkMode, setDarkMode] = useState(() => {
    const savedDark = localStorage.getItem('darkMode');
    return savedDark ? JSON.parse(savedDark) : false;
  });

  // 🌐 Til
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'uz';
  });

  const t = translations[language] || translations.uz;

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const [teachers, setTeachers] = useState(() => {
    const savedTeachers = localStorage.getItem('teachers');
    return savedTeachers ? JSON.parse(savedTeachers) : [
      { id: 1, name: 'Mohirbek', group: 'N26 n105', phone: '+998944481309', email: 'mohirbek@gmail.com', address: 'Tashkent', createdAt: '12.05.2026' }
    ];
  });

  const [groups, setGroups] = useState(() => {
    const savedGroups = localStorage.getItem('groups');
    return savedGroups ? JSON.parse(savedGroups) : [
      { id: 1, active: true, name: 'N26', course: 'Backend', duration: '6 oy', time: '09:30', room: 'Autodesk', teacher: 'Mohirbek', students: 1 },
      { id: 2, active: true, name: 'n105', course: 'Backend', duration: '6 oy', time: '16:00', room: 'Autodesk', teacher: 'Mohirbek', students: 1 }
    ];
  });

  const [students, setStudents] = useState(() => {
    const savedStudents = localStorage.getItem('students');
    return savedStudents ? JSON.parse(savedStudents) : [];
  });

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  const updateUser = (data) => setUser({ ...user, ...data });

  const addTeacher = (teacher) => setTeachers([...teachers, { ...teacher, id: Date.now(), createdAt: new Date().toLocaleDateString() }]);
  const deleteTeacher = (id) => setTeachers(teachers.filter(t => t.id !== id));

  const addGroup = (group) => setGroups([...groups, { ...group, id: Date.now() }]);
  const deleteGroup = (id) => setGroups(groups.filter(g => g.id !== id));
  
  const toggleGroupStatus = (id) => {
    setGroups(groups.map(group => 
      group.id === id ? { ...group, active: !group.active } : group
    ));
  };

  const addStudent = (student) => {
    setStudents([...students, { ...student, id: Date.now(), createdAt: new Date().toLocaleDateString() }]);
  };
  const deleteStudent = (id) => setStudents(students.filter(s => s.id !== id));

  return (
    <AppContext.Provider value={{ 
      user, updateUser, 
      darkMode, toggleDarkMode,
      language, changeLanguage, t,
      teachers, addTeacher, deleteTeacher,
      groups, addGroup, deleteGroup, toggleGroupStatus,
      students, addStudent, deleteStudent
    }}>
      {children}
    </AppContext.Provider>
  );
};
