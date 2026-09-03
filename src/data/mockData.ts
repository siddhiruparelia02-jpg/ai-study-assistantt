import {
  Subject,
  FlashcardDeck,
  NoteItem,
  Quiz,
  StudyMaterial,
  WeakTopic,
  TutorSession,
  ActivityItem,
  StudyStats,
} from '../types';

export const mockStats: StudyStats = {
  streakDays: 0,
  hoursThisWeek: 0,
  targetExamDays: 126,
  targetExamSubject: 'Advance Java',
  cardsDueToday: 0,
  weakTopicsCount: 4,
  quizzesCompleted: 0,
  overallMasteryPercent: 0,
};

export const mockSubjects: Subject[] = [
  {
    id: 'subj-adv-java',
    code: 'ADV-JAVA',
    name: 'Advance Java',
    department: 'Computer Applications',
    semester: 'Semester 4',
    color: 'indigo',
    icon: 'Binary',
    examDate: '2027-01-03',
    daysUntilExam: 126,
    progressPercent: 0,
    totalChapters: 8,
    completedChapters: 0,
    materialsCount: 4,
    weakTopicsCount: 1,
    description: 'Advanced Java programming including JDBC database connectivity, Java Servlets lifecycle, JavaServer Pages (JSP), JavaBeans, Socket Programming, and Multithreading.',
    topics: ['JDBC & Database Connectivity', 'Java Servlet Architecture & Lifecycle', 'JSP Syntax & Custom Tags', 'JavaBeans & Session Tracking', 'Socket Programming & Networking', 'Multithreading & Concurrency'],
  },
  {
    id: 'subj-linux',
    code: 'LINUX',
    name: 'Linux Adminstration',
    department: 'Computer Applications',
    semester: 'Semester 4',
    color: 'emerald',
    icon: 'Terminal',
    examDate: '2027-01-05',
    daysUntilExam: 128,
    progressPercent: 0,
    totalChapters: 8,
    completedChapters: 0,
    materialsCount: 3,
    weakTopicsCount: 1,
    description: 'Linux system administration, file systems and inodes, user and group management, bash shell scripting, process management, cron scheduling, and system services.',
    topics: ['Linux File Hierarchy & Inodes', 'File Permissions & Access Control (chmod/chown)', 'User & Group Administration', 'Bash Shell Scripting & Automation', 'Process Management & Signals', 'Systemd Services & Cron Scheduling'],
  },
  {
    id: 'subj-ecom',
    code: 'ECOM',
    name: 'E-Commerce',
    department: 'Commerce & Computer Applications',
    semester: 'Semester 4',
    color: 'amber',
    icon: 'ShoppingBag',
    examDate: '2027-01-07',
    daysUntilExam: 130,
    progressPercent: 0,
    totalChapters: 6,
    completedChapters: 0,
    materialsCount: 3,
    weakTopicsCount: 1,
    description: 'Architectures of electronic commerce, B2B/B2C/C2C business models, electronic payment systems (EPS, UPI, Payment Gateways), EDI, e-security, and cyber law.',
    topics: ['E-Commerce Business Models (B2B, B2C, C2C)', 'Electronic Payment Systems & Payment Gateways', 'Electronic Data Interchange (EDI)', 'E-Commerce Security & SSL Protocols', 'Digital Marketing & Supply Chain Management', 'IT Act 2000 & Cyber Regulations'],
  },
  {
    id: 'subj-quants',
    code: 'QUANTS',
    name: 'Quants',
    department: 'Mathematics & Analytics',
    semester: 'Semester 4',
    color: 'rose',
    icon: 'Sigma',
    examDate: '2027-01-10',
    daysUntilExam: 133,
    progressPercent: 0,
    totalChapters: 8,
    completedChapters: 0,
    materialsCount: 3,
    weakTopicsCount: 1,
    description: 'Quantitative aptitude, business statistics, probability distributions, linear programming problems (LPP), measures of dispersion, and regression analysis.',
    topics: ['Percentages, Profit & Loss and Ratios', 'Time, Speed, Distance & Work', 'Probability Distributions (Binomial, Poisson, Normal)', 'Linear Programming & Simplex Method', 'Measures of Central Tendency & Dispersion', 'Correlation & Linear Regression'],
  },
];

export const mockFlashcardDecks: FlashcardDeck[] = [
  {
    id: 'deck-java-1',
    subjectId: 'subj-adv-java',
    subjectCode: 'ADV-JAVA',
    title: 'JDBC Architecture & Driver Types',
    description: 'Type 1 to Type 4 JDBC drivers, Connection, Statement, PreparedStatement, and ResultSet lifecycle.',
    cardCount: 6,
    masteredCount: 0,
    color: 'indigo',
    lastStudied: 'Not started',
    cards: [
      {
        id: 'card-java-1',
        subjectId: 'subj-adv-java',
        subjectCode: 'ADV-JAVA',
        deckName: 'JDBC Architecture & Driver Types',
        front: 'What are the four types of JDBC Drivers in Java?',
        back: 'Type 1: JDBC-ODBC Bridge Driver\nType 2: Native-API / Partly Java Driver\nType 3: Network Protocol / All-Java Driver\nType 4: Thin Driver (Direct-to-Database Pure Java Driver)',
        explanation: 'Type 4 (Thin driver) is the most preferred driver in enterprise applications as it communicates directly with the database via socket protocol without native libraries.',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-java-2',
        subjectId: 'subj-adv-java',
        subjectCode: 'ADV-JAVA',
        deckName: 'JDBC Architecture & Driver Types',
        front: 'Why is PreparedStatement preferred over Statement in JDBC?',
        back: '1. Pre-compilation on the database server yields faster execution for repeated queries.\n2. Parameterized placeholders (?) prevent SQL Injection attacks.\n3. Automatic type handling for binary and date parameters.',
        explanation: 'Statement compiles SQL queries on every execution, making it slower and vulnerable to SQL injection.',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-java-3',
        subjectId: 'subj-adv-java',
        subjectCode: 'ADV-JAVA',
        deckName: 'JDBC Architecture & Driver Types',
        front: 'What is the lifecycle of a Java Servlet?',
        back: '1. Loading & Instantiation\n2. init(ServletConfig config) - called once\n3. service(ServletRequest, ServletResponse) - called for each client request\n4. destroy() - called when servlet is undeployed or server shuts down',
        explanation: 'The servlet container initializes a single servlet instance and invokes the service method in multithreaded worker threads.',
        difficulty: 'Hard',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-java-4',
        subjectId: 'subj-adv-java',
        subjectCode: 'ADV-JAVA',
        deckName: 'JDBC Architecture & Driver Types',
        front: 'What are the 4 Session Tracking techniques in Java Servlets?',
        back: '1. Cookies (Client-side key-value pairs)\n2. HttpSession API (Server-side session management)\n3. URL Rewriting (Appending jsessionid to URL)\n4. Hidden Form Fields (<input type="hidden">)',
        explanation: 'HttpSession is the standard mechanism, using a unique JSESSIONID stored as a session cookie or appended via URL rewriting.',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-java-5',
        subjectId: 'subj-adv-java',
        subjectCode: 'ADV-JAVA',
        deckName: 'JDBC Architecture & Driver Types',
        front: 'What are the JSP Directives and their syntax?',
        back: '<%@ directive attribute="value" %>\n1. <%@ page ... %> (imports, errorPage, isELIgnored, contentType)\n2. <%@ include ... %> (static translation-time file inclusion)\n3. <%@ taglib ... %> (imports custom tag libraries and JSTL)',
        explanation: 'Directives give instructions to the JSP container during the translation phase (converting .jsp to .java servlet).',
        difficulty: 'Easy',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-java-6',
        subjectId: 'subj-adv-java',
        subjectCode: 'ADV-JAVA',
        deckName: 'JDBC Architecture & Driver Types',
        front: 'What is the difference between Socket and ServerSocket in Java Socket Programming?',
        back: 'ServerSocket: Listens on a specific TCP port for incoming client connections (accept() method blocks until connection arrives).\nSocket: Represents the endpoint of a two-way TCP connection between client and server.',
        explanation: 'Package java.net provides ServerSocket for server daemons and Socket for bidirectional streaming.',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
    ],
  },
  {
    id: 'deck-linux-1',
    subjectId: 'subj-linux',
    subjectCode: 'LINUX',
    title: 'Linux Permissions, Inodes & Process Management',
    description: 'File permissions (octal & symbolic), inodes, hard vs soft links, cron jobs, and ps/kill signals.',
    cardCount: 6,
    masteredCount: 0,
    color: 'emerald',
    lastStudied: 'Not started',
    cards: [
      {
        id: 'card-linux-1',
        subjectId: 'subj-linux',
        subjectCode: 'LINUX',
        deckName: 'Linux Permissions, Inodes & Process Management',
        front: 'What does the permission chmod 754 file.txt grant in octal representation?',
        back: 'User (7): rwx (Read, Write, Execute - 4+2+1)\nGroup (5): r-x (Read, Execute - 4+1)\nOthers (4): r-- (Read only - 4)',
        explanation: 'Read = 4, Write = 2, Execute = 1. The three digits correspond to Owner, Group, and Others.',
        difficulty: 'Easy',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-linux-2',
        subjectId: 'subj-linux',
        subjectCode: 'LINUX',
        deckName: 'Linux Permissions, Inodes & Process Management',
        front: 'What is an Inode in Linux and what metadata does it store?',
        back: 'An Inode is a data structure storing file metadata: file type, size, owner UID, group GID, permissions, timestamps (atime, mtime, ctime), and disk block pointers.\nNote: The file name is NOT stored in the inode (stored in directory table).',
        explanation: 'Every file on a Linux ext4 filesystem has a unique inode number within that filesystem partition.',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-linux-3',
        subjectId: 'subj-linux',
        subjectCode: 'LINUX',
        deckName: 'Linux Permissions, Inodes & Process Management',
        front: 'What is the key difference between Hard Links and Soft (Symbolic) Links?',
        back: 'Hard Link: Points directly to the file inode. Cannot span across different filesystems; if original is deleted, content remains accessible.\nSoft Link: Contains the path to the original file (own inode). Can cross filesystems; deleting the original creates a dangling link.',
        explanation: 'Created with ln target link (hard link) vs ln -s target link (symbolic link).',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-linux-4',
        subjectId: 'subj-linux',
        subjectCode: 'LINUX',
        deckName: 'Linux Permissions, Inodes & Process Management',
        front: 'What are the 5 time fields in a Linux crontab expression?',
        back: 'Minute (0-59) | Hour (0-23) | Day of Month (1-31) | Month (1-12) | Day of Week (0-6, Sun=0)\nExample: 30 2 * * 1 runs every Monday at 2:30 AM.',
        explanation: 'crontab -e opens the user cron table, managed by the crond daemon.',
        difficulty: 'Easy',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-linux-5',
        subjectId: 'subj-linux',
        subjectCode: 'LINUX',
        deckName: 'Linux Permissions, Inodes & Process Management',
        front: 'What is the difference between kill -15 (SIGTERM) and kill -9 (SIGKILL)?',
        back: 'SIGTERM (15): Graceful termination request. The process can catch the signal, flush buffers, and close open files before exiting.\nSIGKILL (9): Unconditional immediate termination by the Linux kernel. Cannot be caught, blocked, or ignored.',
        explanation: 'Always attempt SIGTERM first to prevent data corruption in database and server processes.',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
    ],
  },
  {
    id: 'deck-ecom-1',
    subjectId: 'subj-ecom',
    subjectCode: 'ECOM',
    title: 'E-Commerce Business Models & EPS',
    description: 'B2B/B2C/C2C models, Electronic Payment Systems, EDI architecture, and SSL encryption standards.',
    cardCount: 5,
    masteredCount: 0,
    color: 'amber',
    lastStudied: 'Not started',
    cards: [
      {
        id: 'card-ecom-1',
        subjectId: 'subj-ecom',
        subjectCode: 'ECOM',
        deckName: 'E-Commerce Business Models & EPS',
        front: 'What are the major E-Commerce Business Models with examples?',
        back: 'B2C (Business-to-Consumer): Amazon, Flipkart\nB2B (Business-to-Business): Alibaba, IndiaMART\nC2C (Consumer-to-Consumer): OLX, eBay\nC2B (Consumer-to-Business): Freelancer, Upwork',
        explanation: 'Categorized by the initiating and receiving economic entities involved in the digital transaction.',
        difficulty: 'Easy',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-ecom-2',
        subjectId: 'subj-ecom',
        subjectCode: 'ECOM',
        deckName: 'E-Commerce Business Models & EPS',
        front: 'What is Electronic Data Interchange (EDI) and its key benefits?',
        back: 'EDI is the computer-to-computer exchange of standard electronic business documents (purchase orders, invoices) between business partners without human intervention.\nBenefits: Eliminates paper delay, reduces data entry errors, accelerates supply chain cycles.',
        explanation: 'Uses international message standards such as ANSI X12 and UN/EDIFACT.',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-ecom-3',
        subjectId: 'subj-ecom',
        subjectCode: 'ECOM',
        deckName: 'E-Commerce Business Models & EPS',
        front: 'How does an Electronic Payment Gateway work during a checkout?',
        back: '1. Customer enters card/UPI details on merchant site.\n2. Payment gateway encrypts data (SSL/TLS) and forwards to Acquiring Bank.\n3. Acquiring bank routes through Card Network (Visa/Mastercard/NPCI) to Issuing Bank.\n4. Issuing bank verifies balance/OTP and returns approval code.\n5. Settlement occurs between banks.',
        explanation: 'Payment gateways like Razorpay, Stripe, and CCAvenue act as PCI-DSS compliant secure intermediaries.',
        difficulty: 'Hard',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
    ],
  },
  {
    id: 'deck-quants-1',
    subjectId: 'subj-quants',
    subjectCode: 'QUANTS',
    title: 'Quantitative Methods, Probability & Statistics',
    description: 'Percentages, probability distributions, Linear Programming (LPP), and Karl Pearson correlation.',
    cardCount: 5,
    masteredCount: 0,
    color: 'rose',
    lastStudied: 'Not started',
    cards: [
      {
        id: 'card-quants-1',
        subjectId: 'subj-quants',
        subjectCode: 'QUANTS',
        deckName: 'Quantitative Methods, Probability & Statistics',
        front: 'What is the formula for Karl Pearson’s Coefficient of Correlation (r)?',
        back: 'r = Cov(X, Y) / (σ_X * σ_Y) = [ Σ(X - x̄)(Y - ȳ) ] / [ √(Σ(X - x̄)²) * √(Σ(Y - ȳ)²) ]',
        explanation: 'The value of r strictly ranges between -1 (perfect negative correlation) and +1 (perfect positive correlation). r = 0 indicates no linear correlation.',
        formula: 'r = \\frac{\\sum (X - \\bar{X})(Y - \\bar{Y})}{\\sqrt{\\sum (X - \\bar{X})^2 \\sum (Y - \\bar{Y})^2}}',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-quants-2',
        subjectId: 'subj-quants',
        subjectCode: 'QUANTS',
        deckName: 'Quantitative Methods, Probability & Statistics',
        front: 'What are the properties of the Normal Probability Distribution?',
        back: '1. Bell-shaped and perfectly symmetrical about the mean (μ = Median = Mode).\n2. Total area under curve = 1.0.\n3. Empirical Rule: 68.27% within μ ± 1σ, 95.45% within μ ± 2σ, 99.73% within μ ± 3σ.\n4. Asymptotic to the horizontal x-axis.',
        explanation: 'Standard Normal Distribution (Z) has mean μ = 0 and standard deviation σ = 1.',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
      {
        id: 'card-quants-3',
        subjectId: 'subj-quants',
        subjectCode: 'QUANTS',
        deckName: 'Quantitative Methods, Probability & Statistics',
        front: 'What are the conditions for formulating a Linear Programming Problem (LPP)?',
        back: '1. Linear Objective Function (Maximize or Minimize Z = c1*x1 + c2*x2).\n2. Linear constraints (equations or inequalities).\n3. Non-negativity restrictions (x1 >= 0, x2 >= 0).\n4. Deterministic parameters (all coefficients known with certainty).',
        explanation: 'Solved graphically for 2 decision variables or using the Simplex algorithm for 3+ variables.',
        difficulty: 'Medium',
        masteryStatus: 'learning',
        lastReviewed: 'Not reviewed',
        reviewCount: 0,
      },
    ],
  },
];

export const mockNotes: NoteItem[] = [
  {
    id: 'note-java-1',
    subjectId: 'subj-adv-java',
    subjectCode: 'ADV-JAVA',
    title: 'JDBC Architecture & PreparedStatement Master Guide',
    topic: 'JDBC & Database Connectivity',
    category: 'Cheat Sheet',
    style: 'Quick Revision',
    length: 'Medium',
    sourceMaterialId: 'mat-java-1',
    sourceMaterialTitle: 'BCA-S4: Advance Java Complete Syllabus & Lab Manual.pdf',
    dateModified: '2026-08-25',
    readTimeMin: 5,
    tags: ['ADV-JAVA', 'JDBC', 'PreparedStatement', 'Database', 'BCA'],
    isPinned: true,
    summary: 'High-yield breakdown of JDBC driver types, step-by-step database connection steps, PreparedStatement parameterized queries, and transaction management.',
    keyTakeaways: [
      'Type 4 Thin Driver communicates directly with the database using proprietary TCP/IP socket protocols.',
      'Always use PreparedStatement to safeguard against SQL Injection vulnerabilities and utilize server-side precompiled query plans.',
      'Always close Connection, Statement, and ResultSet in a try-with-resources block to prevent database connection pool exhaustion.',
      'Use setAutoCommit(false) followed by commit() and rollback() for ACID transaction boundaries.',
    ],
    keyFormulas: [
      {
        name: 'JDBC 5-Step Pipeline',
        formula: 'Class.forName() -> DriverManager.getConnection() -> con.prepareStatement() -> ps.executeQuery() -> con.close()',
        explanation: 'The standard sequential execution pipeline for JDBC connectivity.',
      },
    ],
    contentMarkdown: `# JDBC Architecture & Database Connectivity
## Course: BCA Semester 4 - Advance Java
**Institution:** K. P. B. Hinduja College of Commerce (YCMOU)

### 1. The 5 Steps to Connect to a Database via JDBC
1. **Load the JDBC Driver**: \`Class.forName("com.mysql.cj.jdbc.Driver");\`
2. **Establish Connection**: \`Connection con = DriverManager.getConnection(url, username, password);\`
3. **Create Statement**: \`PreparedStatement ps = con.prepareStatement("SELECT * FROM students WHERE id = ?");\`
4. **Execute Query**: \`ResultSet rs = ps.executeQuery();\`
5. **Close Connection**: \`con.close();\` (or use Java 7+ try-with-resources).

### 2. Four JDBC Driver Categories
* **Type 1 (JDBC-ODBC Bridge)**: Translates JDBC calls to ODBC calls. Requires ODBC configuration on client machine (deprecated).
* **Type 2 (Native-API)**: Converts JDBC calls into native database client API calls. Requires platform-specific C/C++ libraries.
* **Type 3 (Network Protocol)**: Middleware server translates JDBC calls into database-specific protocol.
* **Type 4 (Thin Pure Java Driver)**: Directly communicates via database socket protocol. 100% pure Java, platform-independent, best performance.

### 3. PreparedStatement vs Statement
* **PreparedStatement**: Compiled once by database server. Supports placeholders (\`?\`) for dynamic parameters. Immune to SQL injection.
* **Statement**: Query compiled every time it executes. High risk of SQL injection when concatenating user input.`,
  },
  {
    id: 'note-linux-1',
    subjectId: 'subj-linux',
    subjectCode: 'LINUX',
    title: 'Linux Permissions, Inodes & Shell Scripting Guide',
    topic: 'File Permissions & Access Control',
    category: 'Summary',
    style: 'Detailed Notes',
    length: 'Detailed',
    sourceMaterialId: 'mat-linux-1',
    sourceMaterialTitle: 'Linux Administration Course Notes & Shell Guide.pdf',
    dateModified: '2026-08-25',
    readTimeMin: 6,
    tags: ['LINUX', 'chmod', 'Inodes', 'ShellScripting', 'BCA'],
    isPinned: true,
    summary: 'Comprehensive breakdown of Linux octal permissions, inode structures, symbolic vs hard links, and bash shell scripting control flow.',
    keyTakeaways: [
      'Linux permission bits: Read (4), Write (2), Execute (1) applied to Owner, Group, and Others.',
      'Inodes store all file metadata except the filename itself.',
      'Hard links share the same inode number; soft links possess an independent inode pointing to the original file path.',
      'Bash scripts require #!/bin/bash shebang line and chmod +x execution permissions.',
    ],
    contentMarkdown: `# Linux System Administration & Shell Scripting
## Course: BCA Semester 4 - Linux Administration

### 1. File Permission Calculation (Octal Representation)
Each Linux file has 9 permission bits divided into 3 trios:
* **r (Read)** = 4
* **w (Write)** = 2
* **x (Execute)** = 1

Examples:
* \`chmod 755 script.sh\` -> Owner: rwx (7), Group: r-x (5), Others: r-x (5)
* \`chmod 644 document.txt\` -> Owner: rw- (6), Group: r-- (4), Others: r-- (4)

### 2. Inodes and Link Architecture
* **Inode Table**: Contains file size, owner UID, group GID, permissions, access/modify timestamps, and data block pointers.
* **Hard Link** (\`ln file hardlink\`): Creates another directory entry pointing to the identical inode. Deleting the original file does NOT destroy the data as long as link count > 0.
* **Soft Link** (\`ln -s file softlink\`): Creates a pointer file with its own inode containing the destination path. Breaks if original file is moved or deleted.`,
  },
  {
    id: 'note-ecom-1',
    subjectId: 'subj-ecom',
    subjectCode: 'ECOM',
    title: 'E-Commerce Architecture, Payment Gateways & EDI',
    topic: 'Electronic Payment Systems & Gateways',
    category: 'High-Yield',
    style: 'Exam Notes',
    length: 'Medium',
    dateModified: '2026-08-24',
    readTimeMin: 5,
    tags: ['ECOM', 'PaymentGateways', 'EDI', 'CyberLaw', 'BCA'],
    isPinned: false,
    summary: 'Essential review of B2B/B2C business models, payment gateway authorization workflows, Electronic Data Interchange (EDI), and SSL encryption.',
    keyTakeaways: [
      'E-Commerce models: B2B (Alibaba), B2C (Amazon), C2C (OLX), and C2B (Freelancer).',
      'Payment gateways encrypt sensitive card/UPI credentials and coordinate with acquiring and issuing banks.',
      'EDI standardizes business documents (invoices, POs) for direct computer-to-computer exchange.',
      'IT Act 2000 provides legal recognition for electronic transactions and digital signatures in India.',
    ],
    contentMarkdown: `# E-Commerce Models & Electronic Payment Systems
## Course: BCA Semester 4 - E-Commerce

### 1. E-Commerce Business Models
1. **B2C (Business-to-Consumer)**: Direct sale of goods/services to retail end-users (e.g. Amazon, Flipkart).
2. **B2B (Business-to-Business)**: Wholesale e-commerce between manufacturers and distributors (e.g. IndiaMART, Alibaba).
3. **C2C (Consumer-to-Consumer)**: Online marketplace facilitating consumer auctions and sales (e.g. OLX, eBay).
4. **C2B (Consumer-to-Business)**: Individuals offering services/products to corporate buyers (e.g. Upwork, Shutterstock).

### 2. Electronic Payment Workflow
1. Customer initiates transaction and inputs credit card/UPI details.
2. Merchant web server transmits encrypted data via SSL/TLS to the Payment Gateway.
3. Payment Gateway verifies transaction security and submits to Acquiring Bank processor.
4. Acquiring processor routes to Card Network (Visa/MasterCard/NPCI) and Issuing Bank.
5. Issuing Bank validates credentials/OTP and approves or declines.`,
  },
  {
    id: 'note-quants-1',
    subjectId: 'subj-quants',
    subjectCode: 'QUANTS',
    title: 'Correlation, Regression & Linear Programming (LPP)',
    topic: 'Correlation & Linear Regression',
    category: 'Formulas',
    style: 'Quick Revision',
    length: 'Medium',
    dateModified: '2026-08-24',
    readTimeMin: 6,
    tags: ['QUANTS', 'Correlation', 'Regression', 'LPP', 'BCA'],
    isPinned: false,
    summary: 'High-yield formula sheet for Karl Pearson correlation coefficient, regression lines of Y on X, and Linear Programming graphic feasibility conditions.',
    keyTakeaways: [
      'Correlation coefficient r satisfies -1 <= r <= +1. Independent of origin and scale.',
      'Regression lines intersect at the mean point (x̄, ȳ).',
      'The geometric mean of two regression coefficients byx and bxy equals the correlation coefficient r.',
      'LPP optimal solution always lies at one of the extreme corner points of the bounded feasible region.',
    ],
    contentMarkdown: `# Quantitative Techniques & Business Statistics
## Course: BCA Semester 4 - Quants

### 1. Karl Pearson's Coefficient of Correlation (r)
$$r = \\frac{\\sum (X - \\bar{X})(Y - \\bar{Y})}{\\sqrt{\\sum (X - \\bar{X})^2 \\sum (Y - \\bar{Y})^2}}$$

Properties:
* $r = +1$: Perfect positive linear correlation.
* $r = -1$: Perfect negative linear correlation.
* $r = 0$: No linear relationship between variables.
* The sign of $r$ is always identical to the signs of both regression coefficients $b_{yx}$ and $b_{xy}$.

### 2. Linear Regression Equations
* **Line of Y on X**: $(Y - \\bar{Y}) = b_{yx} (X - \\bar{X})$, where $b_{yx} = r \\frac{\\sigma_y}{\\sigma_x}$
* **Line of X on Y**: $(X - \\bar{X}) = b_{xy} (Y - \\bar{Y})$, where $b_{xy} = r \\frac{\\sigma_x}{\\sigma_y}$
* Fundamental Property: $r = \\pm \\sqrt{b_{yx} \\times b_{xy}}$`,
  },
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-adv-java-1',
    title: 'Advance Java Diagnostic: JDBC, Servlets & JSP',
    subjectId: 'subj-adv-java',
    subjectCode: 'ADV-JAVA',
    durationMinutes: 10,
    questionsCount: 5,
    difficulty: 'Intermediate',
    highScore: 0,
    timesTaken: 0,
    questions: [
      {
        id: 'q-adv-java-1',
        question: 'Which JDBC driver type is written entirely in Java and communicates directly with the database using socket protocols?',
        options: [
          'Type 1 (JDBC-ODBC Bridge)',
          'Type 2 (Native-API)',
          'Type 3 (Network Protocol)',
          'Type 4 (Thin Driver)',
        ],
        correctAnswerIndex: 3,
        explanation: 'Type 4 Thin Driver is a 100% pure Java driver that connects directly to the database without requiring native client libraries or middleware.',
        topic: 'JDBC & Database Connectivity',
        subjectCode: 'ADV-JAVA',
        difficulty: 'Easy',
      },
      {
        id: 'q-adv-java-2',
        question: 'In the Java Servlet lifecycle, which method is executed exactly ONCE when the servlet is first instantiated?',
        options: [
          'service(HttpServletRequest, HttpServletResponse)',
          'init(ServletConfig config)',
          'doGet(HttpServletRequest, HttpServletResponse)',
          'destroy()',
        ],
        correctAnswerIndex: 1,
        explanation: 'The servlet container invokes init(ServletConfig) only once upon servlet loading to perform one-time resource initialization.',
        topic: 'Java Servlet Architecture & Lifecycle',
        subjectCode: 'ADV-JAVA',
        difficulty: 'Easy',
      },
      {
        id: 'q-adv-java-3',
        question: 'Why does PreparedStatement provide better security than standard Statement in JDBC?',
        options: [
          'It automatically encrypts network packets using RSA',
          'It uses parameterized placeholders (?) that treat user input strictly as data, preventing SQL Injection',
          'It prevents database connection timeout errors',
          'It runs on a separate thread pool',
        ],
        correctAnswerIndex: 1,
        explanation: 'Parameterized queries in PreparedStatement separate SQL code from data values, rendering SQL Injection attacks ineffective.',
        topic: 'JDBC & Database Connectivity',
        subjectCode: 'ADV-JAVA',
        difficulty: 'Medium',
      },
      {
        id: 'q-adv-java-4',
        question: 'Which JSP tag directive is used to import Java packages or classes into a JSP page?',
        options: [
          '<%@ page import="package.class" %>',
          '<%@ include file="package.class" %>',
          '<%@ taglib uri="package.class" %>',
          '<jsp:useBean class="package.class" />',
        ],
        correctAnswerIndex: 0,
        explanation: 'The <%@ page import="..." %> directive instructs the JSP translator to include import statements in the generated servlet class.',
        topic: 'JSP Syntax & Custom Tags',
        subjectCode: 'ADV-JAVA',
        difficulty: 'Medium',
      },
      {
        id: 'q-adv-java-5',
        question: 'Which class in java.net is used by a server application to wait for incoming TCP client requests?',
        options: [
          'java.net.Socket',
          'java.net.ServerSocket',
          'java.net.DatagramSocket',
          'java.net.InetAddress',
        ],
        correctAnswerIndex: 1,
        explanation: 'ServerSocket listens on a specified port and its accept() method blocks until a client connection is established.',
        topic: 'Socket Programming & Networking',
        subjectCode: 'ADV-JAVA',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'quiz-linux-1',
    title: 'Linux Administration Diagnostic: Permissions, Inodes & Shell',
    subjectId: 'subj-linux',
    subjectCode: 'LINUX',
    durationMinutes: 10,
    questionsCount: 4,
    difficulty: 'Intermediate',
    highScore: 0,
    timesTaken: 0,
    questions: [
      {
        id: 'q-linux-1',
        question: 'What permissions does the command "chmod 755 script.sh" assign to the file owner, group, and others?',
        options: [
          'Owner: rwx, Group: r-x, Others: r-x',
          'Owner: rwx, Group: rw-, Others: r--',
          'Owner: r-x, Group: r-x, Others: rwx',
          'Owner: rwx, Group: rwx, Others: rwx',
        ],
        correctAnswerIndex: 0,
        explanation: '7 = 4+2+1 (rwx), 5 = 4+1 (r-x), 5 = 4+1 (r-x).',
        topic: 'File Permissions & Access Control',
        subjectCode: 'LINUX',
        difficulty: 'Easy',
      },
      {
        id: 'q-linux-2',
        question: 'Which piece of file metadata is NOT stored inside an Inode in Linux?',
        options: [
          'File size in bytes',
          'File owner UID & Group GID',
          'File name',
          'Access and modification timestamps',
        ],
        correctAnswerIndex: 2,
        explanation: 'The file name is stored exclusively in the parent directory table, mapping the filename to its corresponding inode number.',
        topic: 'Linux File Hierarchy & Inodes',
        subjectCode: 'LINUX',
        difficulty: 'Medium',
      },
      {
        id: 'q-linux-3',
        question: 'Which signal is sent when using the command "kill -9 <PID>"?',
        options: ['SIGTERM', 'SIGINT', 'SIGKILL', 'SIGHUP'],
        correctAnswerIndex: 2,
        explanation: 'Signal 9 corresponds to SIGKILL, which forces immediate termination by the Linux kernel without allowing the process to clean up.',
        topic: 'Process Management & Signals',
        subjectCode: 'LINUX',
        difficulty: 'Easy',
      },
      {
        id: 'q-linux-4',
        question: 'Which crontab entry runs a script every day at 3:30 AM?',
        options: [
          '30 3 * * *',
          '* 3 30 * *',
          '3 30 * * *',
          '0 3 30 * *',
        ],
        correctAnswerIndex: 0,
        explanation: 'Crontab format: [Minute: 30] [Hour: 3] [Day: *] [Month: *] [DayOfWeek: *].',
        topic: 'Systemd Services & Cron Scheduling',
        subjectCode: 'LINUX',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'quiz-ecom-1',
    title: 'E-Commerce Diagnostic: Business Models & EPS',
    subjectId: 'subj-ecom',
    subjectCode: 'ECOM',
    durationMinutes: 10,
    questionsCount: 3,
    difficulty: 'Intermediate',
    highScore: 0,
    timesTaken: 0,
    questions: [
      {
        id: 'q-ecom-1',
        question: 'Which e-commerce business model does an online platform like OLX or eBay represent when consumers sell directly to other consumers?',
        options: ['B2B', 'B2C', 'C2C', 'C2B'],
        correctAnswerIndex: 2,
        explanation: 'C2C (Consumer-to-Consumer) connects individual consumers directly to buy and sell goods.',
        topic: 'E-Commerce Business Models',
        subjectCode: 'ECOM',
        difficulty: 'Easy',
      },
      {
        id: 'q-ecom-2',
        question: 'What is the primary function of an Electronic Payment Gateway in online transactions?',
        options: [
          'To generate web design templates',
          'To securely encrypt and authorize credit card / UPI transactions between buyer, merchant, and banks',
          'To manage warehouse inventory',
          'To eliminate Internet service provider costs',
        ],
        correctAnswerIndex: 1,
        explanation: 'Payment gateways act as secure bridges encrypting and authorizing payment flows between merchant and banking systems.',
        topic: 'Electronic Payment Systems & Payment Gateways',
        subjectCode: 'ECOM',
        difficulty: 'Easy',
      },
      {
        id: 'q-ecom-3',
        question: 'What is Electronic Data Interchange (EDI)?',
        options: [
          'Sending marketing emails to consumers',
          'Computer-to-computer exchange of standard business documents like invoices and purchase orders',
          'A social media chatting application',
          'Video streaming over high-speed networks',
        ],
        correctAnswerIndex: 1,
        explanation: 'EDI standardizes and automates the electronic transfer of business transactions between trade partners without manual data entry.',
        topic: 'Electronic Data Interchange (EDI)',
        subjectCode: 'ECOM',
        difficulty: 'Medium',
      },
    ],
  },
  {
    id: 'quiz-quants-1',
    title: 'Quants Diagnostic: Correlation, Statistics & LPP',
    subjectId: 'subj-quants',
    subjectCode: 'QUANTS',
    durationMinutes: 10,
    questionsCount: 3,
    difficulty: 'Intermediate',
    highScore: 0,
    timesTaken: 0,
    questions: [
      {
        id: 'q-quants-1',
        question: 'What is the mathematical range of Karl Pearson’s coefficient of correlation (r)?',
        options: [
          '0 to 1',
          '-1 to +1',
          '-∞ to +∞',
          '0 to 100',
        ],
        correctAnswerIndex: 1,
        explanation: 'Karl Pearson’s coefficient of correlation r is strictly bounded within [-1, +1].',
        topic: 'Correlation & Linear Regression',
        subjectCode: 'QUANTS',
        difficulty: 'Easy',
      },
      {
        id: 'q-quants-2',
        question: 'If the two regression coefficients are byx = 0.8 and bxy = 0.45, what is the correlation coefficient r?',
        options: ['0.6', '0.36', '0.75', '1.25'],
        correctAnswerIndex: 0,
        explanation: 'r = √(byx * bxy) = √(0.8 * 0.45) = √0.36 = 0.6.',
        topic: 'Correlation & Linear Regression',
        subjectCode: 'QUANTS',
        difficulty: 'Medium',
      },
      {
        id: 'q-quants-3',
        question: 'In a standard Linear Programming Problem (LPP), where does an optimal feasible solution always lie?',
        options: [
          'In the center of the feasible region',
          'At one of the extreme corner vertices of the feasible region',
          'Outside the non-negativity boundary',
          'At the origin (0, 0) exclusively',
        ],
        correctAnswerIndex: 1,
        explanation: 'By the Fundamental Theorem of Linear Programming, optimal solutions always occur at extreme corner boundary points.',
        topic: 'Linear Programming & Simplex Method',
        subjectCode: 'QUANTS',
        difficulty: 'Medium',
      },
    ],
  },
];

export const mockStudyMaterials: StudyMaterial[] = [
  {
    id: 'mat-java-1',
    title: 'BCA-S4: Advance Java Complete Syllabus & Lab Manual.pdf',
    subjectId: 'subj-adv-java',
    subjectCode: 'ADV-JAVA',
    type: 'PDF',
    category: 'Syllabus',
    topic: 'Course Overview & Lab Experiments',
    fileSize: '1.4 MB',
    uploadDate: '2026-08-25',
    tags: ['Syllabus', 'Lab Manual', 'YCMOU', 'BCA Sem 4'],
    status: 'Ready',
    fileContent: `# Advance Java Syllabus & Lab Manual
Course: Bachelor of Computer Applications (BCA) - Semester 4
Institution: K. P. B. Hinduja College of Commerce (YCMOU)

## Module 1: JDBC (Java Database Connectivity)
- JDBC Architecture, 2-tier and 3-tier models
- JDBC Driver Types (Type 1 to Type 4)
- DriverManager, Connection, Statement, PreparedStatement, CallableStatement, ResultSet
- Scrollable and Updatable ResultSets, Metadata interfaces (DatabaseMetaData, ResultSetMetaData)
- Transaction Management and Savepoints

## Module 2: Java Servlets
- Servlet Life Cycle (init, service, destroy)
- Handling HTTP GET and POST requests (HttpServletRequest, HttpServletResponse)
- Session Tracking Mechanisms: Cookies, HttpSession, URL Rewriting, Hidden Form Fields
- ServletConfig and ServletContext interfaces, Servlet Collaboration and RequestDispatcher
- Servlet Filters and Event Listeners

## Module 3: JavaServer Pages (JSP)
- JSP Architecture and Translation Phase
- JSP Scripting Elements (Declarations, Scriptlets, Expressions)
- JSP Directives (page, include, taglib)
- JSP Standard Actions (jsp:include, jsp:forward, jsp:useBean, jsp:setProperty, jsp:getProperty)
- JSTL (JSP Standard Tag Library) and Expression Language (EL)

## Module 4: Networking & Socket Programming
- java.net package: InetAddress, URL, URLConnection
- TCP Sockets: Socket, ServerSocket classes
- DatagramSockets and UDP communication

## Module 5: Enterprise Java & JavaBeans
- JavaBeans design conventions and introspector
- Multithreading synchronization and thread pool concurrency in server apps`,
    generatedItems: {
      flashcards: 12,
      notes: 2,
      quizzes: 1,
    },
    summarySnippet: 'Complete curriculum covering JDBC Type 4 drivers, Servlet lifecycle, JSP tags, Session tracking, and Socket networking for BCA Sem 4.',
  },
  {
    id: 'mat-java-2',
    title: 'Lecture Notes: Servlets, JSP & Session Tracking.md',
    subjectId: 'subj-adv-java',
    subjectCode: 'ADV-JAVA',
    type: 'Markdown',
    category: 'Lecture Notes',
    topic: 'Java Servlet Architecture & Lifecycle',
    fileSize: '820 KB',
    uploadDate: '2026-08-24',
    tags: ['Servlets', 'JSP', 'HttpSession', 'Lecture Notes'],
    status: 'Ready',
    fileContent: `# Lecture Notes: Java Servlets & JSP
## Course: BCA Semester 4 - Advance Java

### 1. The Servlet Lifecycle
The servlet container manages the life cycle of a servlet instance through three main methods:
- **init(ServletConfig config)**: Invoked by the web container once when the servlet is first loaded. Used for initializing database connection pools or reading configuration parameters.
- **service(ServletRequest req, ServletResponse res)**: Invoked for every incoming HTTP request. For HttpServlet, this delegates to doGet(), doPost(), doPut(), etc.
- **destroy()**: Invoked by the container before removing the servlet instance from memory or shutting down the application server.

### 2. Session Tracking Techniques
Because HTTP is a stateless protocol, web applications must maintain state across requests:
1. **Cookies**: Small key-value pairs stored in the user's browser. Vulnerable to cookie blocking.
2. **HttpSession API**: Server allocates a session ID (JSESSIONID) stored in memory, sending the ID to the client via cookie or URL parameter.
3. **URL Rewriting**: Appends ';jsessionid=xyz' to all internal hyperlink URLs.
4. **Hidden Form Fields**: Stores session data in <input type="hidden" name="sessionKey" value="...">.`,
    generatedItems: {
      flashcards: 8,
      notes: 1,
      quizzes: 1,
    },
    summarySnippet: 'Detailed breakdown of servlet lifecycle methods, doGet vs doPost, HttpSession management, and JSP directives.',
  },
  {
    id: 'mat-linux-1',
    title: 'Linux Administration Course Notes & Shell Guide.pdf',
    subjectId: 'subj-linux',
    subjectCode: 'LINUX',
    type: 'PDF',
    category: 'Lecture Notes',
    topic: 'File Permissions & Shell Automation',
    fileSize: '2.1 MB',
    uploadDate: '2026-08-23',
    tags: ['Linux', 'chmod', 'Bash', 'Inodes', 'YCMOU'],
    status: 'Ready',
    fileContent: `# Linux System Administration & Shell Scripting Guide
Course: Bachelor of Computer Applications (BCA) - Semester 4
Institution: K. P. B. Hinduja College of Commerce

## 1. Linux File System Hierarchy Standard (FHS)
- /bin & /sbin: Essential user and system administration binaries
- /etc: System configuration files
- /dev: Device nodes (block and character devices)
- /proc: Virtual pseudo-filesystem exposing kernel state and process runtime data
- /var: Variable data files (logs, spool, mail)
- /home: User personal directory storage

## 2. Inodes and Hard vs Soft Links
An Inode stores:
- File size, permissions, owner UID, group GID
- Creation, modification, and access timestamps
- Pointers to filesystem storage disk blocks
*Hard Link*: Shares the inode with the target file.
*Soft (Symbolic) Link*: Independent inode storing the target path string.

## 3. User & Group Administration
- /etc/passwd: User account records (Username, UID, GID, Home dir, Shell)
- /etc/shadow: Encrypted password hashes and expiration policies
- /etc/group: Group definitions and member lists
Commands: useradd, usermod, userdel, groupadd, passwd, chage.`,
    generatedItems: {
      flashcards: 10,
      notes: 2,
      quizzes: 1,
    },
    summarySnippet: 'Comprehensive coverage of Linux FHS hierarchy, inode management, permissions, and bash automation scripts.',
  },
  {
    id: 'mat-ecom-1',
    title: 'E-Commerce Architecture & Digital Payment Systems.pdf',
    subjectId: 'subj-ecom',
    subjectCode: 'ECOM',
    type: 'PDF',
    category: 'Textbook',
    topic: 'Electronic Payment Systems & Gateways',
    fileSize: '3.4 MB',
    uploadDate: '2026-08-22',
    tags: ['E-Commerce', 'PaymentGateways', 'EDI', 'BCA Sem 4'],
    status: 'Ready',
    fileContent: `# E-Commerce Systems & Digital Payments
Course: BCA Semester 4 - E-Commerce
Institution: K. P. B. Hinduja College of Commerce

## 1. Business Models in Electronic Commerce
- Business to Consumer (B2C): Online retail shopping portals (Amazon, Flipkart)
- Business to Business (B2B): Electronic procurement and wholesale platforms (Alibaba, IndiaMART)
- Consumer to Consumer (C2C): Online classifieds and peer-to-peer auctions (OLX, Quikr)
- Consumer to Business (C2B): Crowdsourcing and freelance marketplaces (Upwork, Fiverr)

## 2. Electronic Data Interchange (EDI)
EDI provides standardized computer-to-computer electronic transmission of trade documents:
- Eliminates manual re-keying of order documents
- Accelerates procurement turnaround times
- Uses internationally agreed standards: ANSI X12, UN/EDIFACT

## 3. Electronic Payment Systems & Cyber Security
- Payment Gateways: Secure intermediary encrypting customer credentials using SSL/TLS
- Two-factor authentication (2FA) and OTP verification
- IT Act 2000: Indian legal framework governing electronic contracts, digital signatures, and cyber offenses`,
    generatedItems: {
      flashcards: 8,
      notes: 1,
      quizzes: 1,
    },
    summarySnippet: 'Textbook notes on B2B/B2C business models, EDI data standards, Payment Gateways, and Indian IT Act 2000.',
  },
  {
    id: 'mat-quants-1',
    title: 'Quantitative Techniques & Business Statistics Handout.pdf',
    subjectId: 'subj-quants',
    subjectCode: 'QUANTS',
    type: 'PDF',
    category: 'Lecture Notes',
    topic: 'Correlation, Probability & Linear Programming',
    fileSize: '1.8 MB',
    uploadDate: '2026-08-21',
    tags: ['Quants', 'Statistics', 'Correlation', 'LPP', 'BCA'],
    status: 'Ready',
    fileContent: `# Quantitative Techniques & Business Statistics
Course: BCA Semester 4 - Quants
Institution: K. P. B. Hinduja College of Commerce

## 1. Correlation and Regression Analysis
- Karl Pearson's Coefficient of Correlation (r): Measures degree of linear association between two variables (-1 <= r <= +1).
- Regression Equations: Predictive models estimating dependent variable Y from independent variable X.
- Properties: r = sqrt(byx * bxy). Regression lines intersect at (x_bar, y_bar).

## 2. Probability Distributions
- Binomial Distribution: Discrete distribution with fixed trials n, constant probability p, P(X=r) = nCr * p^r * q^(n-r).
- Poisson Distribution: Models rare events over fixed interval, P(X=r) = (e^-lambda * lambda^r) / r!.
- Normal Distribution: Continuous bell-shaped symmetric distribution around mean mu with standard deviation sigma.

## 3. Linear Programming Problems (LPP)
- Formulating objective function Z = c1*x1 + c2*x2 (Maximize Profit / Minimize Cost)
- Subject to resource linear constraints and non-negativity conditions (x1 >= 0, x2 >= 0)
- Graphical Method: Plotting constraint boundaries, determining bounded convex feasible polygon, evaluating corner vertices.`,
    generatedItems: {
      flashcards: 10,
      notes: 2,
      quizzes: 1,
    },
    summarySnippet: 'Handout covering Pearson correlation, regression equations, probability distributions, and LPP graphical solutions.',
  },
];

export const mockWeakTopics: WeakTopic[] = [
  {
    id: 'weak-1',
    subjectId: 'subj-adv-java',
    subjectCode: 'ADV-JAVA',
    subjectName: 'Advance Java',
    topicName: 'PreparedStatement vs CallableStatement in JDBC',
    subtopic: 'JDBC & Database Connectivity',
    accuracyRate: 0,
    priority: 'High',
    status: 'Needs Review',
    frequencyInExams: 'Very High',
    lastPracticed: 'Not practiced yet',
    recommendedAction: 'Study JDBC architecture notes and take the diagnostic practice quiz.',
  },
  {
    id: 'weak-2',
    subjectId: 'subj-linux',
    subjectCode: 'LINUX',
    subjectName: 'Linux Adminstration',
    topicName: 'Octal File Permissions & Inode Metadata',
    subtopic: 'File Permissions & Access Control',
    accuracyRate: 0,
    priority: 'High',
    status: 'Needs Review',
    frequencyInExams: 'Very High',
    lastPracticed: 'Not practiced yet',
    recommendedAction: 'Practice chmod permission calculations and inode link exercises.',
  },
  {
    id: 'weak-3',
    subjectId: 'subj-ecom',
    subjectCode: 'ECOM',
    subjectName: 'E-Commerce',
    topicName: 'Electronic Payment Gateway Authorization Cycle',
    subtopic: 'Electronic Payment Systems & Gateways',
    accuracyRate: 0,
    priority: 'Medium',
    status: 'Needs Review',
    frequencyInExams: 'High',
    lastPracticed: 'Not practiced yet',
    recommendedAction: 'Review payment gateway workflow summary and study notes.',
  },
  {
    id: 'weak-4',
    subjectId: 'subj-quants',
    subjectCode: 'QUANTS',
    subjectName: 'Quants',
    topicName: 'Karl Pearson Correlation & Linear Regression Proofs',
    subtopic: 'Correlation & Linear Regression',
    accuracyRate: 0,
    priority: 'Medium',
    status: 'Needs Review',
    frequencyInExams: 'High',
    lastPracticed: 'Not practiced yet',
    recommendedAction: 'Review statistical formulas and solve 5 practice regression problems.',
  },
];

export const mockTutorSessions: TutorSession[] = [
  {
    id: 'session-1',
    title: 'JDBC Drivers & PreparedStatement Explained',
    subjectCode: 'ADV-JAVA',
    mode: 'Concept Breakdown',
    lastActive: 'Ready to start',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        timestamp: '10:00 AM',
        text: 'What is the main difference between Type 1 and Type 4 JDBC drivers, and why is Type 4 preferred for enterprise applications?',
      },
      {
        id: 'msg-2',
        sender: 'tutor',
        timestamp: '10:01 AM',
        text: `Hello Siddhi! Here is a concise breakdown of JDBC Driver Types for your **Advance Java** course:\n\n### Type 1: JDBC-ODBC Bridge Driver\n* Translates JDBC calls into ODBC function calls.\n* **Limitation**: Requires native ODBC binary drivers installed on every client machine, creating platform dependency and poor execution speed.\n\n### Type 4: Pure Java Thin Driver\n* Communicates directly with the database engine using its native TCP/IP network protocol.\n* **Advantages**:\n  1. **100% Pure Java**: No client-side installation or native C/C++ libraries required.\n  2. **High Performance**: No middleware translation layer.\n  3. **Platform Independent**: Deploys seamlessly across Linux and Windows servers.`,
        keyPoints: [
          'Type 1 requires native client ODBC binaries and is deprecated in modern Java.',
          'Type 4 is a direct-to-database pure Java socket driver with the highest throughput.',
          'Always use PreparedStatement with Type 4 drivers for parameterized caching and SQL injection prevention.',
        ],
        codeSnippet: {
          language: 'java',
          code: `// Connecting via Type 4 Thin Driver
Class.forName("com.mysql.cj.jdbc.Driver");
Connection con = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/college_db", "root", "password"
);
PreparedStatement ps = con.prepareStatement(
    "SELECT name, marks FROM students WHERE semester = ?"
);
ps.setInt(1, 4);
ResultSet rs = ps.executeQuery();`,
        },
        suggestedFollowUps: [
          'How does PreparedStatement prevent SQL injection attacks?',
          'Explain the lifecycle of a Java Servlet',
          'Show me how to manage database transactions in JDBC',
        ],
      },
    ],
  },
];

export const mockRecentActivities: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'material',
    title: 'Loaded Advance Java Syllabus & Lab Manual',
    subjectCode: 'ADV-JAVA',
    timestamp: 'Recently',
    scoreOrCount: '12 flashcards ready',
  },
  {
    id: 'act-2',
    type: 'material',
    title: 'Loaded Linux Administration Guide',
    subjectCode: 'LINUX',
    timestamp: 'Recently',
    scoreOrCount: '10 flashcards ready',
  },
  {
    id: 'act-3',
    type: 'material',
    title: 'Loaded E-Commerce Course Notes',
    subjectCode: 'ECOM',
    timestamp: 'Recently',
    scoreOrCount: '8 flashcards ready',
  },
  {
    id: 'act-4',
    type: 'material',
    title: 'Loaded Quantitative Techniques Handout',
    subjectCode: 'QUANTS',
    timestamp: 'Recently',
    scoreOrCount: '10 flashcards ready',
  },
];
