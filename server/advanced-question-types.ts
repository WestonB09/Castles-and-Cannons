import type { InsertEnglishQuestion } from "@shared/schema";

export const advancedQuestionTypes: InsertEnglishQuestion[] = [
  // === FILL-IN-THE-BLANK QUESTIONS ===
  {
    difficulty: "easy",
    question: "I ___ to school every day.",
    correctAnswer: "go",
    wrongAnswers: ["goes", "went", "going"],
    category: "grammar",
    unitReward: "castle",
    questionType: "fill_blank",
    blankPositions: ["go", "walk", "run", "drive"],
    explanation: "We use 'go' with 'I' in present tense.",
    hints: ["Think about present tense with 'I'", "What verb do you use for movement?"],
    tags: ["present_tense", "verb_forms", "daily_activities"]
  },
  {
    difficulty: "moderate",
    question: "She has been ___ English for three years.",
    correctAnswer: "studying",
    wrongAnswers: ["study", "studied", "studies"],
    category: "grammar",
    unitReward: "knight",
    questionType: "fill_blank",
    blankPositions: ["studying", "learning", "practicing", "taking"],
    explanation: "Present perfect continuous uses 'has been + verb-ing'.",
    hints: ["This is present perfect continuous tense", "Think about an action that started in the past and continues now"],
    tags: ["present_perfect_continuous", "verb_tenses", "education"]
  },
  {
    difficulty: "hard",
    question: "If I ___ known about the meeting, I would have attended.",
    correctAnswer: "had",
    wrongAnswers: ["have", "has", "would"],
    category: "grammar",
    unitReward: "archer",
    questionType: "fill_blank",
    blankPositions: ["had", "would have", "could have", "should have"],
    explanation: "Third conditional uses 'if + had + past participle'.",
    hints: ["This is third conditional (unreal past)", "Think about what comes after 'if' in third conditional"],
    tags: ["conditional_sentences", "past_perfect", "hypothetical_situations"]
  },

  // === DRAG-AND-DROP MATCHING ===
  {
    difficulty: "easy",
    question: "Match the animals with their sounds:",
    correctAnswer: "dog-bark,cat-meow,cow-moo,bird-chirp",
    wrongAnswers: ["dog-meow,cat-bark,cow-chirp,bird-moo"],
    category: "vocabulary",
    unitReward: "knight",
    questionType: "drag_drop",
    dragDropPairs: JSON.stringify([
      {"left": "dog", "right": "bark"},
      {"left": "cat", "right": "meow"},
      {"left": "cow", "right": "moo"},
      {"left": "bird", "right": "chirp"}
    ]),
    explanation: "Each animal makes a different sound that we can describe with specific words.",
    hints: ["Think about what sounds you hear from each animal", "Dogs make a loud sound when they see strangers"],
    tags: ["animals", "sounds", "vocabulary_matching"]
  },
  {
    difficulty: "moderate",
    question: "Match the job with the workplace:",
    correctAnswer: "teacher-school,doctor-hospital,chef-restaurant,pilot-airplane",
    wrongAnswers: ["teacher-hospital,doctor-school,chef-airplane,pilot-restaurant"],
    category: "vocabulary",
    unitReward: "cannon",
    questionType: "drag_drop",
    dragDropPairs: JSON.stringify([
      {"left": "teacher", "right": "school"},
      {"left": "doctor", "right": "hospital"},
      {"left": "chef", "right": "restaurant"},
      {"left": "pilot", "right": "airplane"}
    ]),
    explanation: "Different professions work in specific locations.",
    hints: ["Think about where each person does their job", "Where do you go when you're sick?"],
    tags: ["jobs", "workplace", "career_vocabulary"]
  },
  {
    difficulty: "hard",
    question: "Match the literary device with its definition:",
    correctAnswer: "metaphor-comparison without like or as,simile-comparison using like or as,alliteration-repetition of initial sounds,hyperbole-deliberate exaggeration",
    wrongAnswers: ["metaphor-repetition of sounds,simile-exaggeration,alliteration-comparison,hyperbole-opposite meaning"],
    category: "literature",
    unitReward: "castle",
    questionType: "drag_drop",
    dragDropPairs: JSON.stringify([
      {"left": "metaphor", "right": "comparison without like or as"},
      {"left": "simile", "right": "comparison using like or as"},
      {"left": "alliteration", "right": "repetition of initial sounds"},
      {"left": "hyperbole", "right": "deliberate exaggeration"}
    ]),
    explanation: "Literary devices are tools writers use to create meaning and effect.",
    hints: ["Metaphors don't use 'like' or 'as'", "Similes always use comparison words"],
    tags: ["literary_devices", "figurative_language", "writing_techniques"]
  },

  // === LISTENING COMPREHENSION ===
  {
    difficulty: "easy",
    question: "Listen to the dialogue: 'Good morning! How are you?' 'I'm fine, thank you.' What is the appropriate response?",
    correctAnswer: "I'm fine, thank you",
    wrongAnswers: ["Good morning", "See you later", "What's your name?"],
    category: "listening",
    unitReward: "infantry",
    questionType: "listening",

    explanation: "When someone asks 'How are you?', the polite response is 'I'm fine, thank you.'",
    hints: ["Listen for the question being asked", "This is a common greeting response"],
    tags: ["greetings", "polite_conversation", "social_interaction"]
  },
  {
    difficulty: "moderate",
    question: "Listen to the weather report: 'Tomorrow will be sunny with a high of 25°C and light winds.' What will the weather be like?",
    correctAnswer: "sunny and warm",
    wrongAnswers: ["rainy and cold", "cloudy and windy", "snowy and freezing"],
    category: "listening",
    unitReward: "archer",
    questionType: "listening",
    explanation: "The forecast mentions sunny weather with 25°C, which is warm.",
    hints: ["Listen for key weather words", "25°C is considered warm temperature"],
    tags: ["weather_vocabulary", "temperature", "listening_comprehension"]
  },

  // === PRONUNCIATION PRACTICE ===
  {
    difficulty: "easy",
    question: "Which word has the same vowel sound as 'cat'?",
    correctAnswer: "bat",
    wrongAnswers: ["cut", "cute", "coat"],
    category: "pronunciation",
    unitReward: "knight",
    questionType: "pronunciation",

    explanation: "Both 'cat' and 'bat' have the short 'a' sound /æ/.",
    hints: ["Focus on the vowel sound in the middle", "This is a short 'a' sound"],
    tags: ["vowel_sounds", "phonics", "short_a_sound"]
  },
  {
    difficulty: "moderate",
    question: "Which word pair has the same stress pattern as 'photograph'?",
    correctAnswer: "telephone",
    wrongAnswers: ["computer", "banana", "elephant"],
    category: "pronunciation",
    unitReward: "cannon",
    questionType: "pronunciation",

    explanation: "Both 'photograph' and 'telephone' stress the first syllable.",
    hints: ["Listen for which syllable is emphasized", "Count the syllables and find the strongest one"],
    tags: ["word_stress", "syllables", "pronunciation_patterns"]
  },

  // === WRITING SKILLS ===
  {
    difficulty: "easy",
    question: "Which sentence uses correct capitalization?",
    correctAnswer: "I live in New York City.",
    wrongAnswers: ["i live in new york city.", "I Live In New York City.", "I live in new York city."],
    category: "writing",
    unitReward: "castle",
    questionType: "writing_mechanics",
    explanation: "Capitalize 'I', the first word, and proper nouns like city names.",
    hints: ["The word 'I' is always capitalized", "Proper nouns need capital letters"],
    tags: ["capitalization", "proper_nouns", "writing_mechanics"]
  },
  {
    difficulty: "moderate",
    question: "Choose the sentence with correct punctuation:",
    correctAnswer: "Although it was raining, we decided to go hiking.",
    wrongAnswers: ["Although it was raining we decided to go hiking.", "Although, it was raining, we decided to go hiking.", "Although it was raining; we decided to go hiking."],
    category: "writing",
    unitReward: "archer",
    questionType: "writing_mechanics",
    explanation: "Use a comma after an introductory dependent clause.",
    hints: ["Dependent clauses need commas when they start sentences", "Look for the word 'although'"],
    tags: ["comma_usage", "dependent_clauses", "sentence_structure"]
  },

  // === CONVERSATION SKILLS ===
  {
    difficulty: "easy",
    question: "Your friend says 'I'm feeling sick.' What's the most appropriate response?",
    correctAnswer: "I'm sorry to hear that. Do you need anything?",
    wrongAnswers: ["That's great news!", "I don't care.", "Why are you telling me?"],
    category: "conversation",
    unitReward: "infantry",
    questionType: "conversational",
    explanation: "Show empathy and offer help when someone shares they're not feeling well.",
    hints: ["Think about showing care for your friend", "Offer to help when someone is sick"],
    tags: ["empathy", "social_skills", "friendship", "health_topics"]
  },
  {
    difficulty: "moderate",
    question: "You want to politely disagree with someone's opinion. Which is best?",
    correctAnswer: "I see your point, but I think differently because...",
    wrongAnswers: ["You're completely wrong about that.", "That's a stupid idea.", "I don't agree at all."],
    category: "conversation",
    unitReward: "knight",
    questionType: "conversational",
    explanation: "Acknowledge the other person's view before presenting your own opinion.",
    hints: ["Start by showing respect for their opinion", "Use polite language when disagreeing"],
    tags: ["polite_disagreement", "opinion_expression", "social_interaction"]
  },

  // === CULTURAL COMPETENCY ===
  {
    difficulty: "moderate",
    question: "In American culture, what is considered polite when someone gives you a gift?",
    correctAnswer: "Thank them and open it immediately",
    wrongAnswers: ["Put it aside to open later", "Ask how much it cost", "Give it to someone else"],
    category: "culture",
    unitReward: "castle",
    questionType: "cultural",
    explanation: "In American culture, opening gifts immediately shows appreciation and excitement.",
    hints: ["Americans like to see your reaction to gifts", "Showing excitement is considered polite"],
    tags: ["american_culture", "gift_giving", "social_customs", "politeness"]
  },
  {
    difficulty: "hard",
    question: "What does 'reading between the lines' mean in English-speaking cultures?",
    correctAnswer: "Understanding implied or hidden meanings",
    wrongAnswers: ["Reading very carefully", "Reading every other line", "Reading out loud"],
    category: "culture",
    unitReward: "archer",
    questionType: "cultural",
    explanation: "This idiom means to understand what someone really means, even when they don't say it directly.",
    hints: ["This is about understanding hidden meanings", "Think about what people don't say directly"],
    tags: ["idioms", "implied_meaning", "cultural_communication", "indirect_speech"]
  },

  // === ACADEMIC ENGLISH ===
  {
    difficulty: "moderate",
    question: "Which transition word shows contrast?",
    correctAnswer: "However",
    wrongAnswers: ["Furthermore", "Additionally", "Similarly"],
    category: "academic",
    unitReward: "cannon",
    questionType: "academic_writing",
    explanation: "'However' indicates a contrast or opposing idea to what was previously stated.",
    hints: ["Look for a word that shows opposite ideas", "This word introduces a different viewpoint"],
    tags: ["transition_words", "academic_writing", "contrast", "essay_structure"]
  },
  {
    difficulty: "hard",
    question: "In academic writing, which phrase introduces a counterargument?",
    correctAnswer: "Critics argue that",
    wrongAnswers: ["This proves that", "It is clear that", "Everyone agrees that"],
    category: "academic",
    unitReward: "knight",
    questionType: "academic_writing",
    explanation: "'Critics argue that' introduces an opposing viewpoint in academic discourse.",
    hints: ["Look for words that introduce opposing views", "Academic writing considers different perspectives"],
    tags: ["counterarguments", "academic_discourse", "critical_thinking", "argumentation"]
  },

  // === BUSINESS ENGLISH ===
  {
    difficulty: "moderate",
    question: "Which email closing is most professional?",
    correctAnswer: "Best regards,",
    wrongAnswers: ["Love,", "See ya,", "Bye,"],
    category: "business",
    unitReward: "castle",
    questionType: "business_communication",
    explanation: "'Best regards' is a professional and widely accepted email closing.",
    hints: ["Think about formal business communication", "Personal closings aren't appropriate for work"],
    tags: ["email_etiquette", "professional_communication", "business_writing"]
  },
  {
    difficulty: "hard",
    question: "In a business meeting, how do you politely interrupt to ask a question?",
    correctAnswer: "Excuse me, may I ask a quick question?",
    wrongAnswers: ["Stop talking, I have a question", "Hey, listen to me", "You're wrong, let me speak"],
    category: "business",
    unitReward: "archer",
    questionType: "business_communication",
    explanation: "Use polite language and ask permission before interrupting in professional settings.",
    hints: ["Business communication requires politeness", "Ask permission before interrupting"],
    tags: ["meeting_etiquette", "professional_interruption", "workplace_communication"]
  },

  // === CREATIVE WRITING ===
  {
    difficulty: "moderate",
    question: "Which sentence shows 'show, don't tell' in creative writing?",
    correctAnswer: "Her hands trembled as she reached for the door handle.",
    wrongAnswers: ["She was nervous.", "She felt scared.", "She was worried."],
    category: "creative_writing",
    unitReward: "infantry",
    questionType: "creative_techniques",
    explanation: "Showing through actions and details is more engaging than simply stating emotions.",
    hints: ["Look for descriptive actions instead of direct statements", "Actions can show emotions"],
    tags: ["show_dont_tell", "descriptive_writing", "creative_techniques", "narrative_writing"]
  },

  // === TEST PREPARATION ===
  {
    difficulty: "hard",
    question: "Which strategy is most effective for TOEFL reading comprehension?",
    correctAnswer: "Read the questions first, then scan for specific information",
    wrongAnswers: ["Read every word carefully from beginning to end", "Only read the first and last paragraphs", "Guess all answers without reading"],
    category: "test_prep",
    unitReward: "castle",
    questionType: "test_strategy",
    explanation: "Reading questions first helps you focus on relevant information while reading the passage.",
    hints: ["Time management is crucial in TOEFL", "Knowing what to look for helps you read more efficiently"],
    tags: ["toefl_preparation", "reading_strategies", "test_taking_skills", "time_management"]
  }
];