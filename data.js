import bcrypt from "bcrypt";
import { SERVER_ORIGIN } from "./constants";
import { Types } from "mongoose";

export const getMimetype = (s = "") => {
  if (!s) return "";

  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      mp4: "video/mp4",
      mp3: "video/mp3"
    }[
      s
        .split("?")[0]
        .split(".")
        .pop()
        .toLowerCase()
    ] || "application/octet-stream"
  );
};

export const demoUsers = [
  {
    id: "6577d606d6f2f5764bd7973c",
    photoUrl: "man1.jpg",
    username: "Joe Bright"
  },
  {
    id: "6577d606d6f2f5764bd7973d",
    photoUrl: "woman1.jpg",
    username: "Adebayo Opeyemi"
  },
  {
    id: "6577d607d6f2f5764bd7973e",
    photoUrl: "man2.jpg",
    username: "Ayodeji Adepoju"
  },
  {
    id: "6577d607d6f2f5764bd79740",
    photoUrl: "woman2.jpg",
    username: "Elizabeth Johnson"
  },
  {
    id: "6577d607d6f2f5764bd79742",
    photoUrl: "man3.jpeg",
    username: "Michael Williams"
  },
  {
    id: "6577d607d6f2f5764bd79744",
    photoUrl: "woman3.jpeg",
    username: "Olamide Akinloye"
  },
  {
    id: "6577d607d6f2f5764bd79746",
    photoUrl: "man4.jpeg",
    username: "Temiloluwa Ogunsola"
  },
  {
    id: "6577d607d6f2f5764bd79748",
    photoUrl: "woman4.jpg",
    username: "Mary Davis"
  }
].map(u => {
  return {
    ...u,
    _id: new Types.ObjectId(u.id),
    email: u.username.replace(/\s/, "").toLowerCase() + "@demo.com",
    photoUrl: `${SERVER_ORIGIN}/assets/images/${u.photoUrl}`,
    password: bcrypt.hashSync("@testUser1", bcrypt.genSaltSync()),
    accountType: "demo"
  };
});

export const demoPost = [
  {
    text:
      "My feet are tapping to the beat, my heart is soaring with the melody. Every move feels effortless, every step a celebration of life. I am lost in the rhythm, a whirlwind of pure joy. This is happiness, a feeling so alive and vibrant that it fills every corner of my being.",
    type: "happiness",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-alexander-suhorucov-6457579.jpg?alt=media&token=b9f68e83-a6f0-4afa-8e54-7c7a732c2eac"
    ],

    _comments: [
      {
        text: "So happy for you :)"
      },
      {
        text: "Thank you dear!",
        user: true
      },
      {
        text: "Need to know your secret to happiness :("
      },
      {
        text: "Oh dear it Capital G!",
        user: true
      },
      {
        text: "For real. I guess i need to know your God"
      },
      {
        text: ":)",
        user: true
      }
    ]
  },
  {
    text:
      "The aroma of spices fills the air, a symphony of flavors dancing on my tongue. Each bite is an adventure, an exploration of textures and tastes. I am lost in the process, a conductor of culinary delights. This is cooking, a creative expression that nourishes both body and soul.",
    type: "cooking",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpost1.jpeg?alt=media&token=b9e2302a-a96a-4eec-84ff-d5dc0107c7ff"
    ],
    _comments: [
      {
        text: "Spicy in the air",
        user: true
      },
      {
        text: "Can't wait to serve you all :)",
        user: true
      },
      {
        text: "I can't wait to eat"
      },
      {
        text: "Don't worry... In a bit :)",
        user: true
      }
    ]
  },
  {
    text:
      "Paws patter on the ground, a furry whirlwind of playful energy. Tails wag with uncontainable excitement, eyes gleaming with pure joy. A joyous chorus of barks fills the air, a celebration of life's simple pleasures. This is the joy of animals, a reminder of the unadulterated happiness that exists in the world.",
    type: "animal playing",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-pavel-danilyuk-6953356%20(1080p).mp4?alt=media&token=560bc466-3f46-4f6d-9c27-839bc728658b"
    ],
    _comments: [
      {
        text: "Such a cute dog"
      },
      {
        text: "Thank you dear!",
        user: true
      }
    ]
  },
  {
    text:
      "Fingers fly across the keyboard, a symphony of productivity taking shape. Ideas flow freely, a torrent of creativity unleashed. Focus is absolute, a laser beam cutting through distractions. This is the working mood, a state of flow where time stands still and goals are achieved.",
    type: "working",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-djordje-petrovic-2102416.jpg?alt=media&token=f5772d79-7bae-4d97-b24c-2f2288423657"
    ],
    _comments: [
      {
        text: "Punch does keyboard!"
      },
      {
        text: "Hope to work in this level someday"
      },
      {
        text: "Keep doing what you love... with time you will :)",
        user: true
      },
      {
        text: "Don't forget Capital G!",
        user: true
      },
      {
        text: "Uber right?"
      },
      {
        text: "No dear... Chowdeck!",
        user: true
      }
    ]
  },
  {
    text:
      "Hearts intertwined, souls connected, a silent understanding passing between us. Laughter erupts, a shared joy that binds us together. Words flow effortlessly, a tapestry of shared experiences and dreams. This is the essence of a relationship, a safe harbor in the storms of life.",
    type: "relationship",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpost8.jpeg?alt=media&token=db6b2e78-cfeb-42e3-83c8-8ce4ce0c4a89",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2FThe%20kind%20of%20moments%20that%20I%20help%20you%20create%20on%20your%20special%20day%20is%20unmatched%E2%9C%85.%20%23bellanaijaweddings.mp4?alt=media&token=f93a3b25-6159-45f0-9741-916454d9e81f"
    ],
    _comments: [
      {
        text: "So happy for you :)"
      },
      {
        text: "Thank you dear!",
        user: true
      },
      {
        text: "Need to know your secret to happiness :("
      },
      {
        text: "Oh dear it Capital G!",
        user: true
      },
      {
        text: "For real. I guess i need to know your God"
      },
      {
        text: ":)",
        user: true
      }
    ]
  },
  {
    text:
      "Body moving to the rhythm, muscles burning with exertion. sweat dripping like tears of dedication. Every push, every pull, a testament to perseverance. This is the dance mood, a physical expression of inner strength and resilience.",
    type: "dance",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2FThey%20ate%20that%20up%F0%9F%94%A5%20I%20literally%20put%20them%20on%20the%20spot%20and%20said%20go%F0%9F%98%81%20%23stepperton%20%23juliusburphy.mp4?alt=media&token=60ada43a-2f66-42c8-90ca-ddd0d5e81d78",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2FThe%20kind%20of%20moments%20that%20I%20help%20you%20create%20on%20your%20special%20day%20is%20unmatched%E2%9C%85.%20%23bellanaijaweddings.mp4?alt=media&token=f93a3b25-6159-45f0-9741-916454d9e81f"
    ],
    _comments: [
      {
        text: "So happy for you :)"
      },
      {
        text: "Thank you dear!",
        user: true
      },
      {
        text: "Need to know your secret to happiness :("
      },
      {
        text: "Oh dear it Capital G!",
        user: true
      },
      {
        text: "For real. I guess i need to know your God"
      },
      {
        text: ":)",
        user: true
      }
    ]
  },
  {
    text:
      "Muscles pumped, endorphins flowing, a sense of accomplishment washing over me. The feeling of breaking through limits, pushing boundaries, and exceeding expectations. This is the gym mood, a celebration of physical prowess and self-improvement.",
    type: "gym",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2FThey%20ate%20that%20up%F0%9F%94%A5%20I%20literally%20put%20them%20on%20the%20spot%20and%20said%20go%F0%9F%98%81%20%23stepperton%20%23juliusburphy.mp4?alt=media&token=60ada43a-2f66-42c8-90ca-ddd0d5e81d78"
    ],
    _comments: [
      {
        text: "Aiming to be fit",
        user: true
      },
      {
        text: "Inspired by Anthony joshua",
        user: true
      },
      {
        text: "Need to know your secret..."
      },
      {
        text: "High protein, little calories, more water and a good sleep :)",
        user: true
      },
      {
        text: "Wow... need to burn down some calories"
      },
      {
        text: "You should...",
        user: true
      }
    ]
  },
  {
    text:
      "Laughter erupts from deep within, a contagious melody that fills the air. Tears stream down my face, not of sadness, but of sheer happiness. The world around me fades, replaced by an overwhelming sense of contentment and gratitude. This is joy, a pure and unadulterated emotion that fills my heart to bursting.",
    type: "joy",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpost4.jpeg?alt=media&token=f313b419-74b5-4f67-960d-2194c8580750",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpost5.jpeg?alt=media&token=8ab22185-8f8c-4429-8785-a80e3604d99a",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpost8.jpeg?alt=media&token=db6b2e78-cfeb-42e3-83c8-8ce4ce0c4a89",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fvideo%20(2160p).mp4?alt=media&token=c15d8797-8edc-4af8-87db-104740ec2bd5"
    ],
    _comments: [
      {
        text: "So happy for you :)"
      },
      {
        text: "Thank you dear!",
        user: true
      },
      {
        text: "Need to know your secret to happiness :("
      },
      {
        text: "Oh dear it Capital G!",
        user: true
      },
      {
        text: "For real. I guess i need to know your God"
      },
      {
        text: ":)",
        user: true
      }
    ]
  },
  {
    text:
      "The rain falls gently outside, creating a soothing melody against the window pane. A warm blanket envelops me, a haven of comfort and tranquility. I curl up with a good book, the words transporting me to another world. This is the feeling of contentment, a peaceful state of being where worries dissolve and anxieties fade. ",
    type: "contentment",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-pixabay-36717.jpg?alt=media&token=72c0d24b-edb9-4cd4-9774-927b7647e332"
    ]
  },
  {
    text:
      "The wind whispers through the trees, a soothing lullaby against the backdrop of nature's symphony. Stars twinkle brightly in the vast expanse of the night sky, a reminder of the universe's boundless beauty. I feel a sense of peace wash over me, a deep connection to something larger than myself. This is serenity, a state of tranquility where worries melt away and anxieties dissolve.",
    type: "serenity",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-pixabay-36717.jpg?alt=media&token=72c0d24b-edb9-4cd4-9774-927b7647e332"
    ]
  },
  {
    text:
      "A vibrant symphony of colors explodes before my eyes, each hue a testament to the beauty and wonder of nature. I feel utterly captivated, transported to a world where worries melt away and only pure joy exists. This is awe, a profound sense of wonder and amazement at the sheer magnificence of the universe.",
    type: "awe",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-pixabay-36717.jpg?alt=media&token=72c0d24b-edb9-4cd4-9774-927b7647e332"
    ]
  },
  {
    text:
      "A warm embrace envelops me, a haven of comfort and security. Soft whispers and gentle laughter fill the air, creating a soothing melody that calms my soul. I feel a deep sense of peace wash over me, a feeling of being loved and accepted unconditionally. This is belonging, a safe harbor where anxieties fade and worries dissolve.",
    type: "belonging",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpost3.jpeg?alt=media&token=39582761-a2ac-405e-a139-366e7a4a62a3"
    ]
  },
  {
    text:
      "Butterflies flutter in my stomach, a whirlwind of excitement and anticipation. The world seems to shrink and expand all at once, a kaleidoscope of possibilities. Every breath is a prelude to something magical, a feeling of being on the brink of something extraordinary. This is anticipation, the delicious mix of nervousness and excitement before a big event.",
    type: "anticipation",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Finfo2.jpeg?alt=media&token=af36c39a-2264-4b8c-9a3e-2a4a50fa42e1",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Finfo1.jpeg?alt=media&token=5df40947-9859-4380-8014-942e5c7fbe86"
    ],
    _comments: [
      {
        text: "Hopefully toady...",
        user: true
      },
      {
        text: "What happening?"
      },
      {
        text:
          "My startup got selected as part of an accelerator program. Fingers crossed will make top 10!",
        user: true
      },
      {
        text: "Wow... What accelerator program"
      },
      {
        text: "U204Africa. visit wwww.U204Africa.com to learn more",
        user: true
      },
      {
        text: "Thanks for sharing"
      }
    ]
  },
  {
    text:
      "The aroma of freshly baked bread fills the air, a warm and comforting fragrance that evokes memories of home and family. Each bite is a burst of flavor, a reminder of the simple pleasures in life. I feel a sense of contentment wash over me, a feeling of being grateful for all the good things in life. This is comfort, a feeling of warmth, security, and peace.",
    type: "comfort",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Finfo2.jpeg?alt=media&token=af36c39a-2264-4b8c-9a3e-2a4a50fa42e1",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Finfo1.jpeg?alt=media&token=5df40947-9859-4380-8014-942e5c7fbe86"
    ],
    _comments: [
      {
        text: "So happy for you :)"
      },
      {
        text: "Thank you dear!",
        user: true
      },
      {
        text: "Need to know your secret to happiness :("
      },
      {
        text: "Oh dear it Capital G!",
        user: true
      },
      {
        text: "For real. I guess i need to know your God"
      },
      {
        text: ":)",
        user: true
      }
    ]
  },
  {
    text:
      "A fierce determination burns in my heart, a resolute flame that will not be extinguished. I am focused and driven, undeterred by any obstacle that stands in my way. Every step is a testament to my unwavering will, a commitment to reach my goals no matter the cost. This is determination, the unstoppable force that propels me forward.",
    type: "determination"
  },
  {
    text:
      "The world unfolds before me like a canvas, untouched and waiting to be explored. Curiosity bubbles within me, a yearning to discover the unknown and experience the unexpected. I am an explorer, a restless soul constantly seeking new adventures. This is curiosity, the insatiable desire to learn and grow.",
    type: "curiosity",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-flo-dahm-699459.jpg?alt=media&token=58b308c2-cd00-4114-b45f-47d70eb59f8d"
    ]
  },
  {
    text:
      "An exhilarating rush of adrenaline courses through my veins, a surge of energy that makes me feel invincible. My body moves effortlessly, a symphony of power and grace. Every movement is a testament to the strength and resilience of the human spirit. This is excitement, the electrifying feeling of being alive and fully present in the moment.",
    type: "excitement",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-devon-rockola-954677.jpg?alt=media&token=a9e1f0d6-fe20-4606-b9fd-93a1df77faba"
    ],
    _comments: [
      {
        text: "Hopefully toady...",
        user: true
      },
      {
        text: "What happening?"
      },
      {
        text:
          "My startup got selected as part of an accelerator program. Fingers crossed will make top 10!",
        user: true
      },
      {
        text: "Wow... What accelerator program"
      },
      {
        text: "U204Africa. visit wwww.U204Africa.com to learn more",
        user: true
      },
      {
        text: "Thanks for sharing"
      }
    ]
  },
  {
    text:
      "A profound sense of peace settles over me, a quiet stillness that permeates my being. My mind is calm and clear, free from the usual chatter and worries. I am centered and grounded, deeply connected to the present moment. This is mindfulness, the state of being fully aware and present.",
    type: "mindfulness",
    _comments: [
      {
        text: "At the gym :)",
        user: true
      },
      {
        text: "You can be there...",
        user: true
      },
      {
        text: "Will be there... What da location?"
      },
      {
        text: "Saint albert Way. Ikeja Avenue Block N, #12"
      }
    ]
  },
  {
    text:
      "A warm glow fills my chest, spreading outward like a gentle sunrise. Everything around me seems bathed in a golden light, a reminder of the kindness and beauty that exists in the world. I feel a deep sense of gratitude, overflowing with appreciation for all the blessings in my life. This is gratitude, a heartfelt appreciation for all the good things in life.",
    type: "gratitude",
    _comments: [
      {
        text: "Hopefully toady...",
        user: true
      },
      {
        text: "What happening?"
      },
      {
        text:
          "My startup got selected as part of an accelerator program. Fingers crossed will make top 10!",
        user: true
      },
      {
        text: "Wow... What accelerator program"
      },
      {
        text: "U204Africa. visit wwww.U204Africa.com to learn more",
        user: true
      },
      {
        text: "Thanks for sharing"
      }
    ]
  },
  {
    text:
      "A tender touch ignites a spark within me, a warmth that spreads outwards like a wildfire. My heart beats faster, my breath quickens, and my senses are heightened. I am consumed by the presence of the other, lost in the intoxicating world of shared passion. This is desire, a yearning for connection and intimacy.",
    type: "desire"
  },
  {
    text:
      "The world spins around me, a kaleidoscope of colors and sensations. My heart pounds with wild abandon, a drum solo against the roaring wind. Every nerve ending tingles with excitement, a delicious mixture of fear and anticipation. This is exhilaration, the electrifying joy of pushing boundaries and embracing the unknown.",
    type: "exhilaration",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-devon-rockola-954677.jpg?alt=media&token=a9e1f0d6-fe20-4606-b9fd-93a1df77faba"
    ]
  },
  {
    text:
      "A melancholic melody fills the air, echoing the sadness that weighs heavily on my heart. The world seems shrouded in a gray mist, the vibrant colors muted by a pervasive sense of loss. Tears well up in my eyes, a silent expression of the pain and longing that consumes me. This is grief, the raw and unfiltered experience of loss and sorrow.",
    type: "grief",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-netaly-reshef-187083.jpg?alt=media&token=5cee1e8a-7bdf-42a0-945a-9ce09a0d3d56",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-netaly-reshef-187083.jpg?alt=media&token=5cee1e8a-7bdf-42a0-945a-9ce09a0d3d56"
    ],
    _comments: [
      {
        text: "Sorry :)"
      },
      {
        text: "Thank you...",
        user: true
      }
    ]
  },
  {
    text:
      "A warm embrace envelopes me, a haven of comfort and security. The familiar scent of home fills my senses, a soothing balm for the anxieties that plague me. Gentle whispers wash over me, each word a testament to the love and acceptance that surround me. This is belonging, the profound sense of being loved and valued for who I am.",
    type: "belonging",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpexels-pavel-danilyuk-6953356%20(1080p).mp4?alt=media&token=560bc466-3f46-4f6d-9c27-839bc728658b"
    ],
    _comments: [
      {
        text: "So happy for you :)"
      },
      {
        text: "Thank you dear!",
        user: true
      },
      {
        text: "Need to know your secret to happiness :("
      },
      {
        text: "Oh dear it Capital G!",
        user: true
      },
      {
        text: "For real. I guess i need to know your God"
      },
      {
        text: ":)",
        user: true
      }
    ]
  },
  {
    text:
      "A mischievous grin spreads across my face, a spark of rebellion igniting within me. I crave the thrill of the unexpected, the rush of adrenaline that comes from defying expectations. Rules become suggestions, boundaries mere guidelines to be bent and broken. This is rebellion, the intoxicating freedom of breaking free from the constraints of society.",
    type: "rebellion"
  },
  {
    text:
      "The world fades away, my focus narrowed to the rhythmic movement of my breath. Every inhale is a cleansing release, every exhale a surge of peace. A stillness descends upon me, my mind free from the usual chatter and worries. This is mindfulness, the state of being fully present and aware of the moment.",
    type: "mindfulness",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fproduction_id_4874384%20(2160p).mp4?alt=media&token=94240544-bd18-4ec1-b33c-6be8b1929032",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fproduction_id_4874384%20(2160p).mp4?alt=media&token=94240544-bd18-4ec1-b33c-6be8b1929032"
    ]
  },
  {
    text:
      "A wave of joy washes over me, a warm current that fills my heart to bursting. Laughter erupts spontaneously, a melody that carries the weight of pure happiness. The world around me shimmers with newfound beauty, every detail illuminated by the joy that radiates from within. This is joy, the unbridled expression of pure and unadulterated happiness.",
    type: "joy",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2FRecording%202023-04-08%20at%2002.45.52.gif?alt=media&token=6e4d5d31-624f-4e8f-aa6e-12e67ac8c8cd",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fproduction_id_3722209%20(1080p).mp4?alt=media&token=17afb02b-e87f-43bf-a1c3-aefb2f726017"
    ],
    _comments: [
      {
        text: "So happy for you :)"
      },
      {
        text: "Thank you dear!",
        user: true
      },
      {
        text: "Need to know your secret to happiness :("
      },
      {
        text: "Oh dear it Capital G!",
        user: true
      },
      {
        text: "For real. I guess i need to know your God"
      },
      {
        text: ":)",
        user: true
      }
    ]
  },
  {
    text:
      "A quiet desperation gnaws at me, a relentless hunger that consumes my thoughts. My mind races with possibilities, each one more tempting than the last. The world becomes a marketplace of desires, every object and experience a potential source of gratification. This is longing, the insatiable yearning for something beyond one's grasp.",
    type: "longing",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2FRecording%202023-04-08%20at%2002.45.52.gif?alt=media&token=6e4d5d31-624f-4e8f-aa6e-12e67ac8c8cd"
    ]
  },
  {
    text:
      "The scent of freshly baked bread fills the air, a warm hug that evokes memories of childhood comfort. The soft texture of the dough gives way under my fingertips, a sensory experience that grounds me in the present moment. Each bite is an explosion of flavor, a simple pleasure that nourishes both body and soul. This is contentment, the quiet satisfaction of appreciating life's simple joys.",
    type: "contentment",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fgetvideo.page-8kf9jGaLEHwQSQX-.mp4?alt=media&token=0f32e1f4-a436-406e-9204-9d6e1f6c14e7"
    ]
  },
  {
    text:
      "My legs pump, lungs burning, heart pounding a relentless rhythm. Sweat stings my eyes, yet every step forward fuels a fierce fire within. Doubts whisper, but the will to conquer them roars louder. This is the struggle, the arduous climb towards a goal, where exhaustion blends with exhilaration.",
    type: "struggle"
  },
  {
    text:
      "A cold, heavy weight settles in my chest, pressing down on my breath. The world around me seems to dim, colors fading into a monotonous gray. Each day feels like an uphill battle, the joy and energy drained from my soul. This is despair, the suffocating feeling of hopelessness and loss.",
    type: "despair"
  },
  {
    text:
      "The sun warms my skin, a gentle caress on my face. Laughter dances on the wind, a melody carried by the voices of loved ones. Shared stories weave a tapestry of connection, each thread strengthening the bonds that bind us together. This is belonging, a safe haven where vulnerabilities are embraced and hearts resonate as one.",
    type: "belonging"
  },
  {
    text:
      "A rebellious spark ignites in my eyes, challenging the established order. The world becomes a canvas, ready to be painted with the colors of change. Injustice becomes a rallying cry, a call to action that fuels my spirit. This is defiance, the unwavering courage to stand up for what is right, even when faced with opposition.",
    type: "defiance",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpost2.jpeg?alt=media&token=a5b1c21c-bbd0-44c8-8b7a-c6b6513cece9"
    ]
  },
  {
    text:
      "The world around me fades away, replaced by the rhythmic symphony of my own breath. Each inhale a cleansing release, each exhale a surrender to the present moment. Thoughts quiet down, anxieties dissolve, and a profound stillness descends. This is peace, the calm refuge within, where worries lose their power.",
    type: "peace",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpost6.jpeg?alt=media&token=56af9ab2-7de8-4746-8a0e-524deeb69c41"
    ],
    _comments: [
      {
        text: "Please don't give in...  Keep fighting",
        rc: true
      },
      {
        text: "Stay strong",
        rc: true
      },
      {
        text: "Life will do you good soon",
        rc: true
      },
      {
        text: "Oh dear... You need to hold on to God",
        rc: true
      },
      {
        text:
          "Been there... Got comfort and seek advice from strangers... It helped dancing and sharing thought with random strangers...",
        rc: true
      }
    ]
  },
  {
    text:
      "A spontaneous giggle escapes my lips, echoing through the air like a joyous song. The weight of the world lifts, replaced by an infectious lightness. Smiles spread like sunshine, warming hearts and igniting a shared sense of delight. This is joy, a simple and pure expression of happiness that lights up the world around us.",
    type: "joy",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fwoman2.jpg?alt=media&token=8d0653d1-464e-4067-a81c-fa6b8c986cfb"
    ]
  },
  {
    text:
      "A yearning pang pulls at my heart, a bittersweet ache for something just out of reach. Memories flicker like fireflies, illuminating the path not taken. The world whispers possibilities, yet a sense of incompleteness lingers. This is longing, a bittersweet reminder of unfulfilled desires and dreams yet to be chased.",
    type: "longing",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2FWarming%20up%20for%20the%20weekend%20%23dance%20%23petitafro%20%23amapiano%20%23afrodance.mp4?alt=media&token=5a96372e-53db-43e2-9de0-40221591caf4"
    ]
  },
  {
    text: "Super kids!",
    type: "contentment",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2FWarming%20up%20for%20the%20weekend%20%23dance%20%23petitafro%20%23amapiano%20%23afrodance.mp4?alt=media&token=5a96372e-53db-43e2-9de0-40221591caf4"
    ],
    _comments: [
      {
        text: "So happy for you :)"
      },
      {
        text: "Thank you dear!",
        user: true
      },
      {
        text: "Need to know your secret to happiness :("
      },
      {
        text: "Oh dear it Capital G!",
        user: true
      },
      {
        text: "For real. I guess i need to know your God"
      },
      {
        text: ":)",
        user: true
      }
    ]
  },
  {
    type: "animal playing",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2FWho%20did%20it%20best_%20%23dogs%20%23dogsports%20%23flyball.mp4?alt=media&token=27e0a586-578b-48f9-b3a9-867ec3aa5231",
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fvideo%20(2160p).mp4?alt=media&token=c15d8797-8edc-4af8-87db-104740ec2bd5"
    ],
    _comments: [
      {
        text: "Such a cute dog"
      },
      {
        text: "Thank you dear!",
        user: true
      }
    ]
  },
  {
    type: "color",
    medias: [
      "https://firebasestorage.googleapis.com/v0/b/mern-demo-5cd45.appspot.com/o/medias%2Fpattern-1.jpg?alt=media&token=0b805ae1-50a4-471a-ba9d-c221129f9c1c"
    ]
  }
].map(p => {
  return {
    ...p,
    _id: new Types.ObjectId(),
    isDemo: true,
    _comments: p._comments ? p._comments : [],
    medias: p.medias
      ? p.medias.map(m => ({
          ...m,
          id: new Types.ObjectId().toString(),
          url: m,
          mimetype: getMimetype(m)
        }))
      : []
  };
});
