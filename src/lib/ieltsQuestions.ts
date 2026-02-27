export interface IELTSTheme {
  topic: string;
  questions: string[];
}

export interface IELTSPart2Question {
  topic: string;
  prompt: string;
  bullets: string[];
  followUp: string;
}

export interface IELTSPart3Theme {
  topic: string;
  questions: string[];
}

export const part1Themes: IELTSTheme[] = [
  {
    topic: "Accommodation",
    questions: [
      "Tell me about the kind of accommodation you live in.",
      "Do you live in a house or a flat?",
      "Is it a big place?",
      "Does the place you live in have many amenities?",
      "What do you like about living there?",
      "Is there anything you would like to change about the place you live in?",
      "How long have you lived there?",
      "Do you plan to live there for a long time?",
      "Is there a garden in the place you live in?",
      "What is the neighbourhood like?",
      "Do you get along well with your neighbours?",
      "What would your ideal home look like?",
    ],
  },
  {
    topic: "Daily Routine",
    questions: [
      "Tell me about your daily routine.",
      "Has your daily routine changed since you were a child?",
      "Is your daily routine different at the weekend to during the week?",
      "What would you like to change about your daily routine?",
      "Do you think it's important to have a daily routine?",
      "What time do you usually wake up?",
      "Do you prefer mornings or evenings?",
      "How do you usually spend your evenings?",
      "Do you take any breaks during the day?",
      "What is the most productive part of your day?",
      "Do you have any habits you'd like to break?",
      "How do you manage your time?",
    ],
  },
  {
    topic: "Food",
    questions: [
      "Do you enjoy cooking?",
      "What type of things can you cook?",
      "What kinds of food are popular in your country?",
      "Is it an important part of your culture to have dinner parties?",
      "Do you prefer to eat with other people or on your own?",
      "Do you have a healthy diet?",
      "Do you prefer eating at home or eating out?",
      "Do you like ordering food to be delivered?",
      "Who do you usually eat with?",
      "Do you eat meals differently now compared to when you were little?",
      "What is your favourite meal of the day?",
      "Have you ever tried any unusual food?",
    ],
  },
  {
    topic: "Sports",
    questions: [
      "Do you play any sports?",
      "Do you watch sports on TV?",
      "What is the most popular sport in your country?",
      "How do people in your country stay fit?",
      "Is it important for children to play sports?",
      "Is there a lot of sports on television in your country?",
      "What sports do children normally do at school?",
      "Do you think people do enough sport these days?",
      "Have you ever been to a live sports event?",
      "Do you prefer team sports or individual sports?",
      "What sport would you like to try in the future?",
      "How often do you exercise?",
    ],
  },
  {
    topic: "Travel",
    questions: [
      "Where was the last place you visited on holiday?",
      "Would you like to go back there again?",
      "What kind of tourist destinations do you usually prefer?",
      "Has a foreign visitor ever stayed at your home?",
      "What's the best way to save money while travelling?",
      "Do you prefer travelling alone or with others?",
      "What do you always take with you when you travel?",
      "Do you prefer to travel by plane, train, or car?",
      "Have you ever been abroad?",
      "What country would you most like to visit?",
      "Do you like to plan your trips in advance?",
      "What is the longest journey you have ever made?",
    ],
  },
  {
    topic: "Music",
    questions: [
      "How do you listen to music?",
      "When do you listen to music?",
      "What's your favourite kind of music?",
      "Is music an important subject at school in your country?",
      "What kinds of music are most popular in your country?",
      "Do you like to listen to live music?",
      "Is live music popular in your country?",
      "Have you ever been to a concert before?",
      "How much time do you spend listening to music every day?",
      "Are your music tastes varied?",
      "What is your favourite song?",
      "Are you learning to play a musical instrument at the moment?",
    ],
  },
  {
    topic: "Friends",
    questions: [
      "Do you have a lot of friends?",
      "Who is your best friend and why?",
      "Who would you most like to be friends with and why?",
      "What kind of person can you make friends with easily?",
      "Which is more important to you, friends or family?",
      "How often do you see your friends?",
      "What do you usually do with your friends?",
      "Do you prefer one close friend or many friends?",
      "Have you made any new friends recently?",
      "Do you think it's easier to make friends online or in person?",
      "What qualities do you look for in a friend?",
      "Do you stay in touch with childhood friends?",
    ],
  },
  {
    topic: "Weather",
    questions: [
      "How is the weather today?",
      "What's your favourite kind of weather?",
      "Is there any type of weather you really don't like?",
      "What is the climate like in your country?",
      "Does the weather affect people's lives in your country?",
      "Do people change their behaviour in the summer?",
      "Does bad weather ever affect transport in your country?",
      "Tell me about the weather in your country at different times of the year.",
      "Do you usually pay attention to weather forecasts?",
      "Has the weather changed much in your country in recent years?",
      "Would you like to move to a place with different weather?",
      "Does the weather affect the way that you feel?",
    ],
  },
  {
    topic: "Books",
    questions: [
      "Do you like reading books?",
      "How often do you read?",
      "Do you have many books at home?",
      "Do you prefer to buy books or borrow them?",
      "What are the benefits of reading?",
      "What book would you take on a long journey?",
      "How easy is it for you to read books in English?",
      "Have you given up reading a book recently?",
      "What kinds of books do you like to read?",
      "What is the best book you've ever read?",
      "Is reading books a popular activity in your country?",
      "Do you think electronic books are better than real books?",
    ],
  },
  {
    topic: "Work & Study",
    questions: [
      "Do you work or study?",
      "What is your major or what do you do for work?",
      "Do you enjoy it?",
      "What responsibilities do you have?",
      "What is your typical day like?",
      "What would you change about your job or studies?",
      "What job do you think you will be doing in five years?",
      "What skills are required for your work or studies?",
      "Do you get on well with your colleagues or classmates?",
      "Are there good opportunities in your field in your country?",
      "Why did you choose this career or subject?",
      "What was the most difficult part of your work or studies?",
    ],
  },
  {
    topic: "Family",
    questions: [
      "How many people are there in your immediate family?",
      "Who do you get on best with in your family?",
      "Do you have a large extended family?",
      "What do you do together with your family?",
      "Why is family important to you?",
      "Do you all live in the same house?",
      "Who is your favourite family member?",
      "Can you tell me something about your family members?",
      "How much time do you manage to spend with members of your family?",
      "Do you get on well with your family?",
      "Do you do housework at home?",
      "Do you think children should do housework?",
    ],
  },
  {
    topic: "Movies",
    questions: [
      "How often do you go to the cinema?",
      "Are cinema tickets expensive in your country?",
      "What are the advantages of seeing a film at the cinema?",
      "Do you usually watch films alone or with others?",
      "Which actor would you like to play you in a film?",
      "What kinds of films do you like?",
      "What was the last film you saw?",
      "Do you prefer watching films at home or at the cinema?",
      "Who is your favourite film director?",
      "Do you think films can teach us anything?",
      "What is the best film you have ever seen?",
      "Do you like foreign films?",
    ],
  },
];

export const part2Questions: IELTSPart2Question[] = [
  {
    topic: "Travel",
    prompt: "Describe a journey you have been on.",
    bullets: ["Where you went", "What kind of transport you used", "How long the journey took"],
    followUp: "Say whether you think it was easy to take this journey or not, and why.",
  },
  {
    topic: "Work",
    prompt: "Describe your dream job.",
    bullets: ["What kind of things you would do in that job", "What the working conditions would be like", "What kind of workplace you would work in"],
    followUp: "Say if you think you will be able to get a job like that or not, and why.",
  },
  {
    topic: "People",
    prompt: "Describe someone who has had an important influence on your life.",
    bullets: ["Who the person is", "How long you have known him or her", "What qualities this person has"],
    followUp: "Explain why they have had such an influence on you.",
  },
  {
    topic: "Hobby",
    prompt: "Talk about a hobby that you enjoy.",
    bullets: ["What the hobby is", "How often you do it", "Who you do it with"],
    followUp: "Explain why you enjoy this hobby so much.",
  },
  {
    topic: "Books",
    prompt: "Talk about a book you have read recently.",
    bullets: ["Who wrote it", "What it is about", "Whether you enjoyed reading it"],
    followUp: "Why do you think you will or won't read the book again?",
  },
  {
    topic: "Change",
    prompt: "Describe a positive change in your life.",
    bullets: ["What the change was about", "When it happened", "Describe details of the change that happened"],
    followUp: "Describe how it affected you later in life.",
  },
  {
    topic: "Clothes",
    prompt: "Describe your favourite piece of clothing.",
    bullets: ["Where you got it", "Do you often wear it", "When you wear it"],
    followUp: "Explain why it is your favourite piece of clothing.",
  },
  {
    topic: "City",
    prompt: "Describe a city you have visited that you like very much.",
    bullets: ["What is its name and where it is", "When you visited it", "Why you liked it"],
    followUp: "Tell me about the major attractions in this city.",
  },
  {
    topic: "Food",
    prompt: "Describe a meal you enjoyed very much.",
    bullets: ["What you ate", "Where and when you ate it", "Who you ate it with"],
    followUp: "Explain why this meal was so memorable.",
  },
  {
    topic: "Sports",
    prompt: "Describe a sport that you would like to try.",
    bullets: ["Which sport it is", "Where you could do the sport", "Who you could do it with"],
    followUp: "Explain why this sport would be good to try.",
  },
  {
    topic: "Weather",
    prompt: "Describe a time when the weather prevented you from doing something.",
    bullets: ["What your plan was", "What weather you were hoping for", "What happened"],
    followUp: "Explain how you felt when you had to change your plans.",
  },
  {
    topic: "Teachers",
    prompt: "Describe the best teacher you have had.",
    bullets: ["What subject the teacher taught", "When you studied with him or her", "What made that person a good teacher"],
    followUp: "Explain why you think this person was the best teacher you've had.",
  },
];

export const part3Themes: IELTSPart3Theme[] = [
  {
    topic: "Travel",
    questions: [
      "Why do you think some people prefer to travel alone?",
      "How has international travel changed in recent years?",
      "Do you think tourism has a positive or negative impact on local communities?",
      "What can governments do to promote tourism in their countries?",
      "Do you think virtual travel experiences will replace real travel in the future?",
      "How important is it for young people to travel and see the world?",
    ],
  },
  {
    topic: "Work",
    questions: [
      "How do you think the nature of work will change in the future?",
      "Do you think job satisfaction is more important than salary?",
      "What are the advantages and disadvantages of working from home?",
      "Do you think people today have a good work-life balance?",
      "How has technology changed the way people work?",
      "Do you think it's better to work for a large company or a small one?",
    ],
  },
  {
    topic: "People",
    questions: [
      "What qualities do you think make a person a good role model?",
      "Do you think famous people have a responsibility to set a good example?",
      "How do you think family relationships have changed over the generations?",
      "Is it important for children to have role models? Why?",
      "Do you think older people or younger people make better leaders?",
      "How can people be encouraged to help others in their community?",
    ],
  },
  {
    topic: "Hobby",
    questions: [
      "What are the advantages and disadvantages of taking up a new hobby?",
      "Do you think people have enough leisure time these days?",
      "How have people's hobbies changed over the past few decades?",
      "Do you think it's important for people to have hobbies? Why?",
      "Should employers encourage their workers to take up hobbies?",
      "Do you think children should be encouraged to have a variety of hobbies?",
    ],
  },
  {
    topic: "Books",
    questions: [
      "Do people read more nowadays compared to the past?",
      "In your opinion, how will e-books affect paper books?",
      "What's the difference between films and books?",
      "Do you think it is important to read the book before watching the movie version?",
      "Do boys and girls like the same kinds of books?",
      "How important is reading for children's development?",
    ],
  },
  {
    topic: "Change",
    questions: [
      "Do you think change is generally good or bad?",
      "What are some major changes that occur to people throughout their lives?",
      "Is your country changing rapidly?",
      "In what ways have changes in technology changed people's lives?",
      "Why do older people sometimes resist change?",
      "How can people adapt better to change?",
    ],
  },
  {
    topic: "Clothes",
    questions: [
      "Can clothing tell you much about a person?",
      "Do people still wear traditional clothing in your country?",
      "How has clothing fashion changed in your country over the last few decades?",
      "Why do some companies ask their staff to wear uniforms?",
      "What are the advantages and disadvantages of wearing uniforms?",
      "Do you think people wear clothes that reflect their personality?",
    ],
  },
  {
    topic: "City",
    questions: [
      "In your opinion, what makes a city a good one to live in?",
      "What are the advantages of living in a city compared to the countryside?",
      "What are the negative aspects of crowded cities?",
      "How can governments improve living standards in crowded cities?",
      "Do you think there will be more tall buildings in the future?",
      "Would you say urban planning is important?",
    ],
  },
  {
    topic: "Food",
    questions: [
      "How are eating habits in your country different from those in the past?",
      "How healthy is your country's food?",
      "Why do you think different cultures have different table manners?",
      "How might eating habits change in coming decades?",
      "Do you think our diet is important for our health?",
      "What is a balanced diet in your opinion?",
    ],
  },
  {
    topic: "Sports",
    questions: [
      "What is it like to be a professional athlete in your country?",
      "Do you think the government should invest more in sports facilities?",
      "How has the popularity of different sports changed over the years?",
      "Do you think children should be required to do sports at school?",
      "What impact do major sporting events have on a country?",
      "Do you think e-sports should be considered real sports?",
    ],
  },
  {
    topic: "Weather",
    questions: [
      "How does the weather affect people's daily lives in your country?",
      "Do you think climate change is a serious problem?",
      "How can people prepare for extreme weather events?",
      "Do you think weather patterns have changed significantly in recent years?",
      "How does weather affect a country's economy?",
      "Should governments do more to address climate change?",
    ],
  },
  {
    topic: "Teachers",
    questions: [
      "What qualities do you think make a good teacher?",
      "How has the role of teachers changed over time?",
      "Do you think teachers are respected enough in your country?",
      "Should teachers be paid more?",
      "How has technology affected teaching methods?",
      "Do you think online education can replace traditional classroom teaching?",
    ],
  },
];

export function pickPart1Questions(): { topic: string; questions: string[] } {
  const theme = part1Themes[Math.floor(Math.random() * part1Themes.length)];
  return { topic: theme.topic, questions: theme.questions.slice(0, 12) };
}

export function pickPart2Question(): IELTSPart2Question {
  return part2Questions[Math.floor(Math.random() * part2Questions.length)];
}

export function pickPart3Questions(part2Topic: string): string[] {
  const match = part3Themes.find((t) => t.topic === part2Topic);
  if (match) return match.questions.slice(0, 6);
  const fallback = part3Themes[Math.floor(Math.random() * part3Themes.length)];
  return fallback.questions.slice(0, 6);
}
