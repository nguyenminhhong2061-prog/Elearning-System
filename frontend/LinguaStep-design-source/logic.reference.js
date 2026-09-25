// Trích từ index.html (chỉ để đọc tham khảo — bản chạy thật nằm inline trong index.html)

const CARDS = [
  { word: 'resilient', ipa: '/rɪˈzɪliənt/', meaning: 'kiên cường, có khả năng phục hồi', example: 'She is resilient and recovers quickly from setbacks.', exampleVi: 'Cô ấy kiên cường và hồi phục nhanh sau thất bại.' },
  { word: 'procurement', ipa: '/prəˈkjʊərmənt/', meaning: 'hoạt động mua sắm', example: 'The procurement team negotiated a better price.', exampleVi: 'Nhóm mua sắm đã đàm phán được giá tốt hơn.' },
  { word: 'leverage', ipa: '/ˈlevərɪdʒ/', meaning: 'đòn bẩy, tận dụng', example: 'They leveraged their network to close the deal.', exampleVi: 'Họ tận dụng mạng lưới quan hệ để chốt hợp đồng.' }
];

class Component extends DCLogic {
  state = {
    screen: 'login', cardIndex: 0, flipped: false, answered: false, selected: null,
    isPlaying: false, playProgress: 38, speed: 1, showTranslation: false, listenSelected: null,
    recordDone: false, botReplied: false, botTyping: false, chatOpen: false,
    gameScore: 0, gamePicked: null, gameMatched: [],
    goal: 'b1', reminderOn: true, goalSaved: false, vocabTab: 'all', vocabSearch: '',
    customLists: [
      { name: 'Phỏng vấn xin việc', words: ['interview — buổi phỏng vấn', 'candidate — ứng viên', 'offer letter — thư mời làm việc', 'salary — mức lương'] },
      { name: 'Từ vựng thi IELTS', words: ['band score — điểm số', 'fluency — sự trôi chảy', 'coherence — tính mạch lạc', 'lexical resource — vốn từ vựng'] },
      { name: 'Email công việc', words: ['attachment — tệp đính kèm', 'deadline — hạn chót', 'follow up — theo dõi, nhắc lại', 'cc — gửi bản sao'] }
    ],
    selectedListIndex: null, showCreateListModal: false, newListName: '', newWordInput: '', newListWords: []
  };

  pickTile(id, pairIndex) {
    const picked = this.state.gamePicked;
    if (!picked) { this.setState({ gamePicked: id }); return; }
    const pickedPair = parseInt(picked.slice(2));
    if (pickedPair === pairIndex && picked[0] !== id[0]) {
      this.setState({ gameMatched: [...this.state.gameMatched, picked, id], gamePicked: null, gameScore: this.state.gameScore + 30 });
    } else {
      this.setState({ gamePicked: null });
    }
  }

  nav(screen) {
    this.setState({
      screen, flipped: false, answered: false, selected: null,
      isPlaying: false, showTranslation: false, listenSelected: null,
      recordDone: false, botReplied: false, botTyping: false, chatOpen: false,
      gameScore: 0, gamePicked: null, gameMatched: []
    });
  }

  renderVals() {
    const s = this.state.screen;
    const navGroup = {
      progress: 'dashboard', vocab: ['topics', 'topicDetail', 'flashcard', 'flashcardDone'],
      exercise: ['grammarList', 'grammarQuestion', 'grammarResult', 'listeningList', 'listening', 'speakingList', 'speaking'], test: ['testHome', 'testResult'], plan: 'plan'
    };
    const isIn = (v) => Array.isArray(v) ? v.includes(s) : v === s;
    const navBg = {}, navDot = {}, navText = {};
    for (const k of ['progress', 'vocab', 'exercise', 'test', 'plan']) {
      const active = isIn(navGroup[k]);
      navBg[k] = active ? '#12A594' : 'transparent';
      navDot[k] = active ? '#fff' : '#77857F';
      navText[k] = active ? '#fff' : '#D4DAD8';
    }
    const breadcrumbs = {
      login: 'Đăng nhập', dashboard: 'Tiến độ / Trang chủ', topics: 'Từ vựng / Chủ đề',
      topicDetail: 'Từ vựng / Chủ đề / Kinh doanh', flashcard: 'Từ vựng / Ôn tập flashcard',
      flashcardDone: 'Từ vựng / Hoàn thành phiên', grammarList: 'Bài tập / Ngữ pháp',
      grammarQuestion: 'Bài tập / Ngữ pháp / Làm bài', grammarResult: 'Bài tập / Ngữ pháp / Kết quả',
      listeningList: 'Bài tập / Nghe hiểu', listening: 'Bài tập / Nghe hiểu / Hội thoại sân bay',
      speakingList: 'Bài tập / Phát âm', speaking: 'Bài tập / Phát âm / Kinh doanh',
      testHome: 'Kiểm tra / Định kỳ', testResult: 'Kiểm tra / Định kỳ / Kết quả',
      plan: 'Kế hoạch / Kế hoạch học cá nhân',
      vocabGame: 'Từ vựng / Trò chơi & Xếp hạng'
    };
    const q = this.state.vocabSearch.trim().toLowerCase();
    const matchBusiness = !q || 'kinh doanh'.includes(q);
    const matchTravel = !q || 'du lịch'.includes(q);
    const matchHealth = !q || 'y tế'.includes(q);
    const noTopicMatch = !!q && !matchBusiness && !matchTravel && !matchHealth;
    const customLists = this.state.customLists.map((l, i) => ({
      name: l.name, count: l.words.length, open: () => this.setState({ selectedListIndex: i })
    }));
    const selectedList = this.state.selectedListIndex !== null ? this.state.customLists[this.state.selectedListIndex] : null;
    const vocabTabColor = { all: this.state.vocabTab === 'all' ? '#0B7B70' : '#77857F', mine: this.state.vocabTab === 'mine' ? '#0B7B70' : '#77857F' };
    const vocabTabBorder = { all: this.state.vocabTab === 'all' ? '2px solid #12A594' : '2px solid transparent', mine: this.state.vocabTab === 'mine' ? '2px solid #12A594' : '2px solid transparent' };
    const goalColor = { b1: this.state.goal === 'b1' ? '#0B7B70' : '#16211F', b2: this.state.goal === 'b2' ? '#0B7B70' : '#16211F' };
    const goalBg = { b1: this.state.goal === 'b1' ? '#E2F5F2' : '#fff', b2: this.state.goal === 'b2' ? '#E2F5F2' : '#fff' };
    const goalBorder = { b1: this.state.goal === 'b1' ? '2px solid #12A594' : '1px solid #D4DAD8', b2: this.state.goal === 'b2' ? '2px solid #12A594' : '1px solid #D4DAD8' };
    const tabScreens = { grammar: 'grammarList', listening: ['listeningList', 'listening'], speaking: ['speakingList', 'speaking'], chatbot: 'chatbot' };
    const tabBg = {}, tabColor = {};
    for (const k in tabScreens) {
      const v = tabScreens[k];
      const active = Array.isArray(v) ? v.includes(s) : v === s;
      tabBg[k] = active ? '#12A594' : 'transparent';
      tabColor[k] = active ? '#fff' : '#475551';
    }
    const speedMap = { s075: 0.75, s1: 1, s125: 1.25 };
    const speedBg = {}, speedColor = {};
    for (const k in speedMap) {
      const active = this.state.speed === speedMap[k];
      speedBg[k] = active ? '#12A594' : '#fff';
      speedColor[k] = active ? '#fff' : '#475551';
    }
    const listenOptions = [
      { label: 'Quầy làm thủ tục', correct: true }, { label: 'Cổng lên máy bay' }, { label: 'Khu vực hành lý' }
    ].map((o, i) => {
      const sel = this.state.listenSelected === i;
      return {
        label: o.label, select: () => this.setState({ listenSelected: i }),
        border: sel ? '2px solid #12A594' : '1px solid #D4DAD8',
        bg: sel ? '#E2F5F2' : '#fff', color: sel ? '#0B7B70' : '#475551'
      };
    });
    const GAME_PAIRS = [
      { en: 'apple', vi: 'quả táo' }, { en: 'river', vi: 'con sông' },
      { en: 'honest', vi: 'trung thực' }, { en: 'journey', vi: 'chuyến đi' }
    ];
    const matched = this.state.gameMatched;
    const gameTiles = [];
    GAME_PAIRS.forEach((p, i) => {
      const enDone = matched.includes('en' + i), viDone = matched.includes('vi' + i);
      const enPicked = this.state.gamePicked === 'en' + i, viPicked = this.state.gamePicked === 'vi' + i;
      gameTiles.push({
        label: p.en, id: 'en' + i,
        bg: enDone ? '#16A34A' : enPicked ? '#FDBA74' : 'rgba(255,255,255,.92)',
        color: enDone ? '#fff' : enPicked ? '#7C2D12' : '#0B7B70',
        select: enDone ? (() => {}) : () => this.pickTile('en' + i, i)
      });
      gameTiles.push({
        label: p.vi, id: 'vi' + i,
        bg: viDone ? '#16A34A' : viPicked ? '#FDBA74' : 'rgba(255,255,255,.92)',
        color: viDone ? '#fff' : viPicked ? '#7C2D12' : '#0B7B70',
        select: viDone ? (() => {}) : () => this.pickTile('vi' + i, i)
      });
    });
    const card = CARDS[this.state.cardIndex];
    const grammarOptions = [
      { label: 'lives' }, { label: 'has lived', correct: true }, { label: 'is living' }, { label: 'lived' }
    ].map((o, i) => {
      const sel = this.state.selected === i;
      return {
        label: o.label,
        select: () => this.setState({ answered: true, selected: i }),
        border: sel ? '2px solid #12A594' : '1px solid #D4DAD8',
        bg: sel ? '#E2F5F2' : '#fff',
        color: sel ? '#0B7B70' : '#475551'
      };
    });

    return {
      isLogin: s === 'login',
      isLoggedIn: s !== 'login',
      isDashboard: s === 'dashboard', isTopics: s === 'topics', isTopicDetail: s === 'topicDetail',
      isFlashcard: s === 'flashcard', isFlashcardDone: s === 'flashcardDone',
      isGrammarList: s === 'grammarList', isGrammarQuestion: s === 'grammarQuestion', isGrammarResult: s === 'grammarResult',
      isTestHome: s === 'testHome', isTestResult: s === 'testResult', isPlan: s === 'plan',
      goalColor, goalBg, goalBorder,
      selectGoalB1: () => this.setState({ goal: 'b1', goalSaved: false }), selectGoalB2: () => this.setState({ goal: 'b2', goalSaved: false }),
      reminderBg: this.state.reminderOn ? '#12A594' : '#D4DAD8', reminderMargin: this.state.reminderOn ? 'auto' : '0',
      toggleReminder: () => this.setState({ reminderOn: !this.state.reminderOn, goalSaved: false }),
      saveGoal: () => this.setState({ goalSaved: true }), saveGoalLabel: this.state.goalSaved ? '✓ Đã lưu mục tiêu' : 'Lưu mục tiêu',
      breadcrumb: breadcrumbs[s] || '',
      navBg, navDot, navText,
      isVocabGame: s === 'vocabGame', goToVocabGame: () => this.nav('vocabGame'),
      isVocabTabAll: this.state.vocabTab === 'all', isVocabTabMine: this.state.vocabTab === 'mine',
      vocabTabColor, vocabTabBorder,
      setVocabTabAll: () => this.setState({ vocabTab: 'all', selectedListIndex: null }), setVocabTabMine: () => this.setState({ vocabTab: 'mine' }),
      vocabSearch: this.state.vocabSearch, handleSearchChange: (e) => this.setState({ vocabSearch: e.target.value }),
      matchBusiness, matchTravel, matchHealth, noTopicMatch,
      customLists, selectedList,
      noListSelected: this.state.selectedListIndex === null, hasListSelected: this.state.selectedListIndex !== null,
      closeListDetail: () => this.setState({ selectedListIndex: null }),
      openCreateList: () => this.setState({ showCreateListModal: true, newListName: '', newWordInput: '', newListWords: [] }),
      closeCreateList: () => this.setState({ showCreateListModal: false }),
      showCreateListModal: this.state.showCreateListModal,
      newListName: this.state.newListName, handleNewListName: (e) => this.setState({ newListName: e.target.value }),
      newWordInput: this.state.newWordInput, handleNewWordInput: (e) => this.setState({ newWordInput: e.target.value }),
      newListWords: this.state.newListWords.map((w, i) => ({ text: w, remove: () => this.setState({ newListWords: this.state.newListWords.filter((_, j) => j !== i) }) })),
      addWordToNewList: () => {
        const w = this.state.newWordInput.trim();
        if (!w) return;
        this.setState({ newListWords: [...this.state.newListWords, w], newWordInput: '' });
      },
      saveListBg: (this.state.newListName.trim() && this.state.newListWords.length) ? '#12A594' : '#D4DAD8',
      saveNewList: () => {
        if (!this.state.newListName.trim() || !this.state.newListWords.length) return;
        this.setState({
          customLists: [...this.state.customLists, { name: this.state.newListName.trim(), words: this.state.newListWords }],
          showCreateListModal: false, vocabTab: 'mine', selectedListIndex: null
        });
      },
      gameTiles, gameScore: this.state.gameScore, gameTime: '00:42',
      goToDashboard: () => this.nav('dashboard'), goToTopics: () => this.nav('topics'),
      goToTopicDetail: () => this.nav('topicDetail'), goToFlashcard: () => this.nav('flashcard'),
      goToGrammarList: () => this.nav('grammarList'), goToGrammarQuestion: () => this.nav('grammarQuestion'),
      goToGrammarResult: () => this.nav('grammarResult'), goToTestHome: () => this.nav('testHome'),
      goToTestResult: () => this.nav('testResult'), goToPlan: () => this.nav('plan'),
      logout: () => this.nav('login'),
      restartFlashcard: () => this.setState({ screen: 'flashcard', cardIndex: 0, flipped: false }),
      cardDots: CARDS.map((_, i) => i <= this.state.cardIndex ? '#12A594' : '#D4DAD8'),
      cardPos: (this.state.cardIndex + 1) + '/' + CARDS.length,
      currentCard: card, notFlipped: !this.state.flipped, isFlipped: this.state.flipped,
      flipCard: () => this.setState({ flipped: !this.state.flipped }),
      nextCard: () => {
        if (this.state.cardIndex >= CARDS.length - 1) this.setState({ screen: 'flashcardDone' });
        else this.setState({ cardIndex: this.state.cardIndex + 1, flipped: false });
      },
      grammarOptions, answered: this.state.answered,
      nextBtnBg: this.state.answered ? '#12A594' : '#D4DAD8',

      isListening: s === 'listening', isSpeaking: s === 'speaking',
      isListeningList: s === 'listeningList', isSpeakingList: s === 'speakingList',
      goToListening: () => this.nav('listening'), goToSpeaking: () => this.nav('speaking'),
      goToListeningList: () => this.nav('listeningList'), goToSpeakingList: () => this.nav('speakingList'),
      tabBg, tabColor,
      showChatFab: ['grammarList', 'grammarQuestion', 'grammarResult', 'listeningList', 'listening', 'speakingList', 'speaking'].includes(s),
      chatOpen: this.state.chatOpen, toggleChat: () => this.setState({ chatOpen: !this.state.chatOpen }),
      isPlaying: this.state.isPlaying, notPlaying: !this.state.isPlaying,
      playProgress: this.state.playProgress,
      togglePlay: () => this.setState({ isPlaying: !this.state.isPlaying }),
      speedBg, speedColor,
      setSpeed075: () => this.setState({ speed: 0.75 }), setSpeed1: () => this.setState({ speed: 1 }), setSpeed125: () => this.setState({ speed: 1.25 }),
      showTranslation: this.state.showTranslation, toggleBg: this.state.showTranslation ? '#12A594' : '#D4DAD8',
      toggleMargin: this.state.showTranslation ? 'auto' : '0',
      toggleTranslation: () => this.setState({ showTranslation: !this.state.showTranslation }),
      listenOptions, listenNextBg: this.state.listenSelected !== null ? '#12A594' : '#D4DAD8',

      isRecordDone: this.state.recordDone, isNotRecordDone: !this.state.recordDone,
      startRecord: () => setTimeout(() => this.setState({ recordDone: true }), 700),
      resetRecord: () => this.setState({ recordDone: false }),

      showBotReply: this.state.botReplied, showTyping: this.state.botTyping,
      askBot: () => {
        if (this.state.botReplied) return;
        this.setState({ botTyping: true });
        setTimeout(() => this.setState({ botTyping: false, botReplied: true }), 900);
      }
    };
  }
}
