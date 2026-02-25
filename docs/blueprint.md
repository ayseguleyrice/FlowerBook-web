# **App Name**: FlowerBook

## Core Features:

- AI Plant Identification Tool: Capture plant images via camera and leverage an AI API (e.g., Plant.id or Google Vision AI) to identify the species and generate 'Plant Whisperer' care recommendations (Watering, Pruning, Light, Humidity, Toxicity).
- Plant Post Creation & Privacy: Create new posts with identified plant images, choosing to publish publicly to the 'Blooming' feed or save privately to 'My Garden'. All post data is stored in Firebase Firestore.
- Global 'Blooming' Feed: Browse an infinite-scrolling feed of public plant posts from other users, sorted by a trending score, with options to filter by nearby geographical locations. Public post data and metadata are sourced from Firebase Firestore.
- 'My Garden' Personal Sanctuary: Access a private 'Shelf View' to showcase personal plant collections, track growth history, and monitor a 'Garden Happiness Meter' based on care frequency, with data managed in Firebase Firestore.
- Interactive Social Engagement: Engage with public posts through a 1-5 star rating slider that triggers 'Petal/Pollen' particle animations. Participate in threaded comments with accepted friends; friendship statuses and comment data are stored in Firebase Firestore.
- User Authentication & Profile Management: Securely register and log in via Firebase Authentication. Manage user profiles including display name, avatar, and rank, with user data stored in Firebase Firestore.
- In-App Advertisements: Integrate native advertisements powered by Google AdMob to support application development and maintenance.

## Style Guidelines:

- Primary color: A warm, earthy terracotta (#C4673B) to evoke a natural, inviting feel.
- Background color: A soft, almost neutral beige (#FAF7F5), lightly tinted with the primary hue for a harmonious and warm foundation.
- Accent color: A gentle, dusty rose (#EBABA9), providing a delicate contrast for interactive elements and highlights, consistent with the warm aesthetic.
- Headlines and Body text: 'PT Sans' (humanist sans-serif) for its modern, friendly, and highly readable qualities, suitable for both short headlines and forum-style deep interactions.
- Use soft, rounded line icons with botanical themes to maintain an amateur-friendly and sincere visual tone.
- Implement an Instagram-like single-post vertical scroll for the 'Blooming' feed and a unique 'Shelf View' for 'My Garden'. Camera access will be via a prominent center navigation button, and comments will support nested threading.
- Incorporate Lottie animations for a delightful 'Planting' sequence during AI processing and 'Petal/Pollen' particle effects for a visually rewarding 5-star rating interaction.