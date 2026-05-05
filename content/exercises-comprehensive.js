/**
 * COMPREHENSIVE EXERCISE LIBRARY
 *
 * Extracted from all ingested source materials (281 documents).
 * Similar exercises are grouped as variations (v1.1, v1.2, etc.)
 *
 * Sources include:
 * - Polyvagal Exercises for Safety and Connection (Deb Dana)
 * - Polyvagal Prompts (Deb Dana)
 * - Anchored (Deb Dana)
 * - The Polyvagal Theory in Therapy (Deb Dana)
 * - Somatic Psychotherapy Toolbox (125 exercises)
 * - Somatic Therapy for Healing Trauma
 * - 101 Trauma-Informed Interventions (Linda Curran)
 * - Trauma-Informed Yoga (47 practices)
 * - Depth psychology and Jungian visualization traditions
 * - Self-Therapy Vol 1-3 + Workbook (Jay Earley)
 * - IFS Skills Training Manual
 * - No Bad Parts (Richard Schwartz)
 * - Practicing Mindfulness (75 meditations)
 * - Real Happiness (Sharon Salzberg)
 * - 108 Meditation Instructions
 * - Behavioral psychology and habit formation research
 * - Complex PTSD Workbook
 * - After the Ceremony Ends
 * - The Psychedelic Explorer's Guide
 * - Core Beliefs, Harnessing the Power
 * - MindWorks
 * - SMART Recovery Handbook
 * - And many more...
 *
 * Categories:
 * - breathing: Breath-based regulation
 * - grounding: Present-moment anchoring
 * - somatic: Body-based awareness and release
 * - polyvagal: Nervous system mapping, tracking, and shaping
 * - partsWork: IFS-based internal dialogue
 * - selfCompassion: Loving-kindness and self-care
 * - meditation: Seated/formal contemplative practices
 * - jungian: Shadow work, archetypes, and depth psychology visualization
 * - cbt: Cognitive restructuring and belief work
 * - habits: Behavioral change practices
 * - psychedelicIntegration: Integration-specific exercises
 * - yoga: Trauma-informed movement practices
 */

export const exercises = {

  // ============================================================
  // BREATHING EXERCISES
  // ============================================================
  breathing: [
    {
      id: 'BR-001',
      title: "Calming Breath for Integration",
      steps: [
        "Place one hand on your chest, one on your belly",
        "Breathe in slowly through your nose for 4 counts",
        "Hold gently for 4 counts",
        "Exhale slowly through your mouth for 6 counts",
        "Repeat 5-8 times",
        "Notice how your body feels now and what wants to be explored"
      ],
      duration: 3,
      instructions: "Activates the parasympathetic nervous system and creates space for therapeutic exploration",
      source: "App original"
    },
    {
      id: 'BR-001.1',
      title: "Extended Exhale Breathing",
      variationOf: 'BR-001',
      steps: [
        "Sit comfortably with your spine supported",
        "Breathe in through your nose for 4 counts",
        "Exhale through your mouth for 8 counts, making a soft 'haaa' sound",
        "Let the exhale be twice as long as the inhale",
        "With each exhale, feel the vagal brake re-engaging",
        "Continue for 2-3 minutes",
        "Notice any shift in your autonomic state"
      ],
      duration: 3,
      instructions: "Extended exhale activates the vagal brake, shifting from sympathetic to ventral vagal state",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'BR-002',
      title: "Box Breathing",
      steps: [
        "Sit comfortably with your spine straight",
        "Exhale completely through your mouth",
        "Breathe in through your nose for 4 counts",
        "Hold your breath for 4 counts",
        "Exhale through your mouth for 4 counts",
        "Hold empty for 4 counts",
        "Repeat for 5-10 cycles"
      ],
      duration: 5,
      instructions: "Used by Navy SEALs, this technique helps manage stress and maintain calm in challenging situations",
      source: "App original"
    },
    {
      id: 'BR-003',
      title: "Find Your Breath",
      steps: [
        "Sit quietly and turn your attention to your breathing",
        "Don't try to change it—just notice it",
        "Where do you feel your breath most strongly? Nostrils? Chest? Belly?",
        "Notice the rhythm: Is it fast or slow? Shallow or deep?",
        "What autonomic state does your breath pattern reflect?",
        "Stay with awareness of your breath for 2 minutes",
        "Notice if simply attending to your breath changes it"
      ],
      duration: 3,
      instructions: "Breath awareness as a window into your autonomic state",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'BR-003.1',
      title: "Understand Your Breath",
      variationOf: 'BR-003',
      steps: [
        "Notice your breath without changing it",
        "Now intentionally take a deep breath and notice how your system responds",
        "Try a breath with a long, slow exhale—what shifts?",
        "Try a breath that fills your belly first, then chest",
        "Experiment: What breathing pattern brings the most calm?",
        "What pattern brings alertness without anxiety?",
        "Create your personal 'regulating breath' based on what you discovered"
      ],
      duration: 5,
      instructions: "Discover which breathing patterns shift your nervous system toward regulation",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'BR-003.2',
      title: "Follow Your Breath",
      variationOf: 'BR-003',
      steps: [
        "Close your eyes and bring attention to your breath",
        "Follow the full journey of one breath: in through nostrils, down the throat, filling the lungs",
        "Follow it back out: lungs emptying, air moving up, exiting through nose or mouth",
        "Stay with 5 complete breath journeys",
        "Notice: does the breath pause at the top? At the bottom?",
        "Feel the vagal brake relaxing on the inhale, re-engaging on the exhale",
        "End by letting your breath return to its natural rhythm"
      ],
      duration: 4,
      instructions: "Deepen breath awareness by tracking the full respiratory cycle and its autonomic effects",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'BR-004',
      title: "Vagal Toning Through Sound",
      steps: [
        "Sit comfortably and take a deep breath",
        "On the exhale, make a humming sound (like 'vvvv' or 'mmm')",
        "Feel the vibration in your chest and throat",
        "Continue for 5-10 breaths",
        "Notice if you feel more settled and present",
        "This stimulates the vagus nerve for calm and connection"
      ],
      duration: 3,
      instructions: "Directly activate your vagus nerve to shift from stress to safety",
      source: "The Polyvagal Theory in Therapy (Deb Dana)"
    },
    {
      id: 'BR-004.1',
      title: "The Sound of Your Voice",
      variationOf: 'BR-004',
      steps: [
        "Listen to your voice as you speak a neutral phrase aloud",
        "Notice the qualities: Is it tight or open? High or low? Fast or slow?",
        "What autonomic state do you hear in your voice?",
        "Now intentionally soften your voice—speak slowly, with warmth",
        "Feel how changing your voice changes your internal state",
        "Experiment with humming, singing, or chanting",
        "Find the vocal quality that brings the most ventral vagal energy"
      ],
      duration: 5,
      instructions: "Your voice both reflects and shapes your autonomic state. Vocal prosody exercises the social engagement system",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'BR-005',
      title: "Physiological Sigh",
      steps: [
        "Take a quick double inhale through your nose (two short sniffs)",
        "Follow with a long, slow exhale through your mouth",
        "The double inhale re-inflates the alveoli in your lungs",
        "The extended exhale activates the parasympathetic system",
        "Repeat 2-3 times",
        "Notice the immediate calming effect"
      ],
      duration: 1,
      instructions: "The fastest known way to calm your nervous system in real-time. Discovered by Stanford neuroscience research",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'BR-006',
      title: "4-7-8 Relaxation Breath",
      steps: [
        "Place the tip of your tongue behind your upper front teeth",
        "Exhale completely through your mouth with a whoosh sound",
        "Inhale quietly through your nose for 4 counts",
        "Hold your breath for 7 counts",
        "Exhale completely through your mouth for 8 counts",
        "Repeat the cycle 3-4 times",
        "Notice the deepening relaxation with each cycle"
      ],
      duration: 3,
      instructions: "A natural tranquilizer for the nervous system. Regular practice increases effectiveness",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
  ],

  // ============================================================
  // GROUNDING EXERCISES
  // ============================================================
  grounding: [
    {
      id: 'GR-001',
      title: "5-4-3-2-1 Sensory Grounding",
      steps: [
        "Look around and name 5 things you can see",
        "Notice and name 4 things you can touch or feel",
        "Listen for and name 3 things you can hear",
        "If possible, name 2 things you can smell",
        "Name 1 thing you can taste, or take a sip of water",
        "Take a deep, slow breath and feel your feet on the ground",
        "Say to yourself: 'I am here, I am safe, I am integrating'"
      ],
      duration: 3,
      instructions: "Sensory grounding to stay present while processing meaningful experiences",
      source: "App original"
    },
    {
      id: 'GR-002',
      title: "Earth Connection",
      steps: [
        "Stand or sit with your feet flat on the ground",
        "Feel the weight of your body pressing down",
        "Imagine roots growing from your feet into the earth",
        "Notice the solid, stable support beneath you",
        "Take 5 deep breaths, feeling more grounded with each one",
        "Thank the earth for holding you"
      ],
      duration: 2,
      instructions: "Quick grounding technique to reconnect with physical stability and safety",
      source: "App original"
    },
    {
      id: 'GR-003',
      title: "Ventral Vagal Anchors",
      steps: [
        "WHO: List people (or pets) who bring you a feeling of safety and welcome",
        "WHAT: Think about activities that bring your ventral vagal state alive—small nourishing actions",
        "WHERE: Take a mental tour of your world—find physical places that bring cues of safety",
        "WHEN: Identify moments in time when you feel anchored in calm, connected energy",
        "Write down at least one anchor in each category",
        "When you notice a shift away from safety, return to one of your anchors",
        "Update your list as you discover new anchors over time"
      ],
      duration: 10,
      instructions: "Build a personalized resource list of people, activities, places, and moments that anchor you in regulation",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'GR-003.1',
      title: "Finding Glimmers",
      variationOf: 'GR-003',
      steps: [
        "A 'glimmer' is a micro-moment of ventral vagal regulation—a tiny spark of safety or connection",
        "Set an intention to notice glimmers throughout your day",
        "When you notice one (a warm cup of tea, sunlight, a kind word), pause",
        "Stop and savor the glimmer for 20-30 seconds",
        "Where do you feel it in your body?",
        "Name it: 'This is a glimmer'",
        "Keep a running list of your glimmers"
      ],
      duration: 2,
      instructions: "Train your nervous system to notice micro-moments of safety and connection, interrupting the negativity bias",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'GR-003.2',
      title: "From Glimmer to Glow",
      variationOf: 'GR-003',
      steps: [
        "Start with a glimmer you recently noticed",
        "Close your eyes and bring the full experience of that glimmer to mind",
        "Amplify it: add sensory details (sight, sound, temperature, texture)",
        "Let the glimmer expand—feel it grow from a spark to a warm glow",
        "Stay with the glow for 30-60 seconds",
        "Notice how your nervous system responds to the expanded experience",
        "Practice turning glimmers into glows regularly to build ventral vagal tone"
      ],
      duration: 3,
      instructions: "Extend micro-moments of safety into sustained experiences of regulation",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'GR-004',
      title: "Attending in Nature",
      steps: [
        "Go outside or look out a window at a natural scene",
        "Notice what draws your attention—a tree, clouds, water, earth",
        "Track your autonomic response to what you see",
        "Find the element of nature that brings the strongest sense of regulation",
        "Stay with it. Let your nervous system attune to the natural rhythms",
        "Notice: Does the sky bring spaciousness? Do trees bring stability?",
        "Make a practice of seeking out these natural regulators"
      ],
      duration: 5,
      instructions: "Nature provides powerful cues of safety. Green, blue, and natural environments shape the nervous system toward regulation",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'GR-005',
      title: "Container Exercise",
      steps: [
        "Imagine a sturdy container—a box, safe, vault, or treasure chest",
        "Give it vivid details: material, color, size, weight of the lid",
        "Identify any distressing thoughts, images, or feelings you want to set aside temporarily",
        "Visualize placing each one into the container",
        "Close the lid securely. It will stay there until you choose to open it",
        "Notice the relief of setting things down",
        "You can return to the container when you're ready and resourced"
      ],
      duration: 3,
      instructions: "A containment strategy for managing overwhelming material between sessions or during daily life",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'GR-006',
      title: "Safe/Calm Place Visualization",
      steps: [
        "Close your eyes and imagine a place where you feel completely safe and at peace",
        "It can be real or imaginary—a beach, forest, room, or any setting",
        "Engage all senses: What do you see? Hear? Smell? Feel on your skin?",
        "Notice the temperature, the quality of light, any sounds",
        "Let yourself fully arrive in this place",
        "Give this place a name or cue word you can use to return quickly",
        "Practice returning to this place throughout your day"
      ],
      duration: 5,
      instructions: "Create a reliable internal resource you can access anytime for nervous system regulation",
      source: "Somatic Psychotherapy Toolbox"
    },
    {
      id: 'GR-007',
      title: "Ventral Vagal Space of Your Own",
      steps: [
        "Look around your home and notice which spaces feel cozy, comforting, and connecting",
        "Identify what makes them feel that way—lighting, objects, arrangement",
        "Notice spaces that feel dysregulating (chaotic, dull, disconnecting)",
        "Choose a corner, shelf, or room to make into your ventral vagal space",
        "Add objects that bring your nervous system alive—photos, textures, scents",
        "Make small changes and track your autonomic response to each",
        "Find the balance of open and filled that feels nourishing"
      ],
      duration: 15,
      instructions: "Create physical environments that provide cues of safety and inspire ventral vagal energy",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
  ],

  // ============================================================
  // SOMATIC EXERCISES
  // ============================================================
  somatic: [
    {
      id: 'SO-001',
      title: "Integration Body Scan",
      steps: [
        "Start at the top of your head and breathe gently",
        "Slowly scan down through your face and neck",
        "Notice your shoulders, arms, and chest without changing anything",
        "Continue to your belly, back, and hips",
        "Scan through your legs and feet",
        "Where in your body do you feel your psychedelic insights most strongly?",
        "Send breath and appreciation to those areas",
        "Thank your body for holding your experience with such wisdom"
      ],
      duration: 5,
      instructions: "Connecting with how your body holds and integrates your psychedelic experience",
      source: "App original"
    },
    {
      id: 'SO-002',
      title: "Progressive Muscle Relaxation",
      steps: [
        "Lie down or sit comfortably",
        "Tense your feet and toes for 5 seconds, then release",
        "Tense your calves and thighs for 5 seconds, then release",
        "Tense your buttocks and abdomen for 5 seconds, then release",
        "Tense your chest and shoulders for 5 seconds, then release",
        "Tense your arms and hands for 5 seconds, then release",
        "Tense your neck and jaw for 5 seconds, then release",
        "Notice the difference between tension and relaxation"
      ],
      duration: 8,
      instructions: "Release physical tension held in the body from stress or difficult experiences",
      source: "Somatic Psychotherapy Toolbox"
    },
    {
      id: 'SO-003',
      title: "Body Language Awareness",
      steps: [
        "Stand in front of a mirror or simply tune into your posture",
        "Notice: Are your shoulders raised or dropped? Jaw clenched or soft?",
        "What is your facial expression communicating?",
        "How is your body positioned—open or closed? Leaning forward or back?",
        "What autonomic state does your body language reflect?",
        "Experiment: change your posture to reflect ventral vagal safety",
        "Notice how changing your body position shifts your internal state"
      ],
      duration: 5,
      instructions: "Your body language both reflects and shapes your autonomic state. The social engagement system reads and responds to body cues",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'SO-004',
      title: "Pendulation",
      steps: [
        "Call up a SIFT memory (a safe, connected, ventral vagal memory)",
        "Take a few moments to notice how your nervous system feels in this safe state",
        "Now bring to mind a mildly activating memory (2-4 on a 1-10 scale, NOT overwhelming)",
        "Notice how your nervous system shifts—feel the change in body and mind",
        "Now say the name of your safe memory and return to it fully",
        "Feel your nervous system shift back toward calm and connection",
        "Alternate between the two, noticing the shifts each time",
        "End by anchoring in your safe memory"
      ],
      duration: 8,
      instructions: "Build nervous system flexibility by gently oscillating between states of activation and regulation",
      source: "Polyvagal Exercises (SIFT Exercise - Deb Dana)"
    },
    {
      id: 'SO-005',
      title: "Moments of Movement",
      steps: [
        "Notice your current autonomic state",
        "What movement does your body want to make right now?",
        "If in sympathetic: try shaking, stomping, pushing against a wall, or dancing",
        "If in dorsal: try gentle stretching, rocking, or slow walking",
        "If in ventral: try flowing movements, swaying, or reaching outward",
        "Move in whatever way feels right for 2-3 minutes",
        "Notice how movement shifts your state",
        "Find the movements that reliably bring you toward ventral regulation"
      ],
      duration: 5,
      instructions: "Movement is a powerful autonomic regulator. Match the type of movement to your current state",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'SO-006',
      title: "Butterfly Hug (Bilateral Stimulation)",
      steps: [
        "Cross your arms over your chest, placing each hand on the opposite shoulder",
        "Alternately tap your shoulders, left then right, at a comfortable pace",
        "Keep your eyes closed or softly focused downward",
        "Continue tapping for 1-2 minutes",
        "Breathe naturally and notice any shifts in your body",
        "This bilateral stimulation helps process and integrate experiences",
        "Use whenever you feel activated or need to self-soothe"
      ],
      duration: 3,
      instructions: "Self-administered bilateral stimulation that supports nervous system regulation and emotional processing",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'SO-007',
      title: "Self-Havening Touch",
      steps: [
        "Gently stroke your arms from shoulder to elbow, alternating sides",
        "Or gently stroke your face from forehead down to chin",
        "Or rub your palms together slowly",
        "Use a pace that feels soothing—not too fast, not too slow",
        "Continue for 2-3 minutes while thinking of a calming image",
        "This activates delta waves in the brain, reducing stress hormones",
        "Notice the warmth and settling that follows"
      ],
      duration: 3,
      instructions: "Self-soothing touch technique that activates the body's natural calming mechanisms",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'SO-008',
      title: "Somatic Experiencing Discharge",
      steps: [
        "Notice any areas of activation in your body (tingling, heat, tension, trembling)",
        "Don't try to stop or change the sensation—just notice it with curiosity",
        "Follow the sensation: Does it move? Expand? Contract?",
        "Allow any natural discharge: shaking, trembling, deep breaths, yawning",
        "These are signs of your nervous system completing a stress response",
        "Stay present and let the process unfold naturally",
        "Notice when the activation settles and a sense of calm arrives"
      ],
      duration: 10,
      instructions: "Support your nervous system in completing incomplete stress responses through natural discharge",
      source: "Somatic Psychotherapy Toolbox"
    },
    {
      id: 'SO-009',
      title: "Stepping-Stones of Your Life",
      steps: [
        "Imagine flying up above the 'river' of your life in a spaceship",
        "See stepping-stones from birth to now, each representing key moments",
        "First, notice 5-10 stones where you felt threat, danger, or overwhelm",
        "For each, briefly note it and any body sensations you feel right now",
        "Now look again for stones of ease, peace, and safety",
        "Notice the sensations those memories bring to your body",
        "Your life contains BOTH kinds of stones. Let your body hold this truth"
      ],
      duration: 15,
      instructions: "Creates a somatic map of your life's difficult and resourceful moments. Both are part of your story",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'SO-010',
      title: "Sensory Language Practice",
      steps: [
        "Close your eyes and scan your body for any sensation",
        "Practice finding precise words: is it tingling, buzzing, pulsing, or vibrating?",
        "Is it sharp or dull? Warm or cool? Heavy or light?",
        "Does it have a shape? A color? A texture?",
        "Now find a different sensation and describe it",
        "Practice this for 3-5 different body areas",
        "Building this vocabulary dramatically improves body-mind connection"
      ],
      duration: 5,
      instructions: "Most people have limited language for body sensations. Expanding your somatic vocabulary is foundational for all body-based healing",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'SO-011',
      title: "Bilateral Drawing",
      steps: [
        "Take a large sheet of paper and hold a pen or crayon in EACH hand",
        "Begin drawing with both hands simultaneously",
        "Don't plan what to draw—let both hands move freely",
        "Notice how each hand wants to move. Let them work together or independently",
        "The cross-hemisphere brain activity promotes integration and self-regulation",
        "Draw for 5-10 minutes, staying present with the sensations of movement",
        "When done, notice how you feel compared to when you started"
      ],
      duration: 10,
      instructions: "Bilateral drawing engages both brain hemispheres simultaneously, promoting trauma integration similar to EMDR's bilateral stimulation",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'SO-012',
      title: "Grounding Through Earth Contact",
      steps: [
        "Walk barefoot on carpet and notice the sensations",
        "Walk barefoot on tile or linoleum—how does this differ?",
        "If possible, walk barefoot on grass or soil",
        "Try placing your hands on firm ground and loose soil",
        "Notice what you feel in your body with each texture change",
        "If available, try wrapping your arms around a tree trunk (it's surprisingly powerful)",
        "Your body has electrical conductivity to the earth—skin-to-earth contact is regulating"
      ],
      duration: 10,
      instructions: "Direct contact with the earth activates the body's grounding response. Research supports 'earthing' for nervous system regulation",
      source: "Somatic Therapy for Healing Trauma"
    },
  ],

  // ============================================================
  // POLYVAGAL / NERVOUS SYSTEM EXERCISES
  // ============================================================
  polyvagal: [
    {
      id: 'PV-001',
      title: "Notice and Name",
      steps: [
        "Tune into your thoughts, feelings, and the way your body feels",
        "Notice where you are on your autonomic map (ventral/sympathetic/dorsal)",
        "Name the state: 'I am in ventral' or 'I notice sympathetic activation'",
        "Bring curiosity: What does your nervous system want you to know right now?",
        "Stay with this practice until it becomes easy and automatic",
        "Use it throughout the day to build autonomic awareness"
      ],
      duration: 2,
      instructions: "The foundational polyvagal skill. Naming your state brings perception to neuroception and interrupts automatic patterns",
      source: "The Polyvagal Theory in Therapy (Deb Dana)"
    },
    {
      id: 'PV-002',
      title: "Autonomic Mapping (Personal Profile Map)",
      steps: [
        "Draw a vertical ladder with three sections: Ventral (top), Sympathetic (middle), Dorsal (bottom)",
        "Start by mapping your SYMPATHETIC state: What does it feel like? Look like? Sound like?",
        "What happens in your body? What do you do? Think? Say?",
        "Complete the sentence: 'I am...' and 'The world is...' from this state",
        "Repeat for your DORSAL VAGAL state (be gentle—just dip a toe in)",
        "Finally, map your VENTRAL VAGAL state fully—let this state come alive",
        "Give each state a personal name",
        "Always end by anchoring in your ventral vagal experience"
      ],
      duration: 20,
      instructions: "Create a personalized map of your three autonomic states. This map becomes a reference tool for all polyvagal work",
      source: "The Polyvagal Theory in Therapy (Deb Dana)"
    },
    {
      id: 'PV-003',
      title: "Autonomic Alphabet",
      steps: [
        "Create three alphabet lists—one for each autonomic state",
        "Start with DORSAL VAGAL: Find a word for each letter (A=Absent, B=Blank, C=Collapsed...)",
        "Move to SYMPATHETIC: Find a word for each letter (A=Alarmed, B=Buzzing, C=Claustrophobic...)",
        "End with VENTRAL VAGAL: Find a word for each letter (A=Awesome, B=Benevolent, C=Courageous...)",
        "You may need to get creative with X!",
        "Use your alphabets: When you notice a familiar feeling, find it in your alphabet and name the state",
        "This builds nuanced awareness of the many flavors of each state"
      ],
      duration: 15,
      instructions: "Expand your vocabulary for autonomic experiences. Moving beyond broad categories builds awareness of subtle state shifts",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'PV-004',
      title: "SIFT Exercise",
      steps: [
        "Retrieve a ventral vagal memory—one that feels safe, connected, and calm",
        "Tell the story of that memory (internally, in writing, or to someone)",
        "Find which element feels most alive: Sensation, Image, or Feeling",
        "Start with that element, then add the next layer (e.g., Sensation + Image)",
        "Add the third element (Sensation + Image + Feeling)",
        "Add a Thought—a belief or summary that captures the experience",
        "Hold all four elements together: BE in that moment fully",
        "Give this SIFT memory a short name you can recall instantly"
      ],
      duration: 10,
      instructions: "Create a multi-layered ventral vagal anchor using Sensation, Image, Feeling, and Thought. The more elements, the more real it feels",
      source: "Polyvagal Exercises (Deb Dana)"
    },
    {
      id: 'PV-005',
      title: "Savoring the State",
      steps: [
        "Bring attention to a moment of ventral vagal regulation",
        "Stay present to the physical sense of this state",
        "Notice: breath, heartbeat, warmth, energy moving, internal space",
        "Imagine your vagal brake working effortlessly and smoothly",
        "Bring your full attention to savoring this state",
        "Stay in the savoring practice for 20-30 seconds",
        "This interrupts the negativity bias and builds ventral vagal tone"
      ],
      duration: 1,
      instructions: "A quick practice (20-30 seconds) that interrupts the negativity bias by attending to moments of regulation",
      source: "The Polyvagal Theory in Therapy (Deb Dana)"
    },
    {
      id: 'PV-005.1',
      title: "Savoring the Experience",
      variationOf: 'PV-005',
      steps: [
        "Bring attention to a moment of ventral vagal regulation",
        "Sense the moment in your body",
        "Invite in the images, feelings, and thoughts that accompany the moment",
        "Actively receive the fullness: sight, sound, emotion, belief, and body",
        "Let physiology and story move together",
        "Bring your full attention to the experience for 20-30 seconds",
        "Share the experience with someone to strengthen it (optional)"
      ],
      duration: 2,
      instructions: "Savoring the full experience (vs. just the state) adds psychological richness. Sharing deepens it further",
      source: "The Polyvagal Theory in Therapy (Deb Dana)"
    },
    {
      id: 'PV-006',
      title: "Soup of the Day",
      steps: [
        "At the end of the day, imagine your autonomic tone as a bowl of soup",
        "What is the overall 'flavor' of your day?",
        "Identify the ingredients: moments of ventral vagal, sympathetic, and dorsal vagal activation",
        "Note the intense experiences (strong state shifts) and the milder seasonings (subtle movements within a state)",
        "Look for ventral vagal moments that may have been missed among the messiness",
        "Write the recipe: What was the blend of states that created today's soup?",
        "Over time, notice patterns in your daily soups"
      ],
      duration: 5,
      instructions: "End-of-day reflection that reveals the blend of autonomic states shaping your daily experience",
      source: "The Polyvagal Theory in Therapy (Deb Dana)"
    },
    {
      id: 'PV-006.1',
      title: "Daily Pie Chart",
      variationOf: 'PV-006',
      steps: [
        "Each evening, draw a blank circle",
        "Choose colors to represent ventral vagal, sympathetic, and dorsal vagal",
        "Divide the circle into sections representing the proportion of time in each state today",
        "Name your day based on the overall autonomic tone",
        "Collect your daily charts over time",
        "Look for patterns: certain days of the week, weekday vs weekend, seasonal shifts",
        "Use the collection to understand your autonomic experience over time"
      ],
      duration: 5,
      instructions: "Visual tracking of daily autonomic states. Pie charts bring the feeling of the day alive in shape and color",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'PV-007',
      title: "Daily Tracker - Three Different Ways",
      steps: [
        "Review your day and identify three different ways your nervous system responded",
        "Notice what happened: a slightly less intense response, an easier recovery, a different kind of response",
        "Also notice what DIDN'T happen: the absence of a reaction is also a sign of change",
        "Write down your three different ways",
        "Remember: look for what's different, not what's better or worse",
        "Keep a journal of daily 'three different ways' experiences",
        "Review periodically to see how your responses are changing over time"
      ],
      duration: 5,
      instructions: "Track incremental changes in your nervous system patterns. Small shifts accumulate into transformation",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'PV-008',
      title: "Story of Three States",
      steps: [
        "Think of a slightly distressing experience—just enough to feel the state, not overwhelming",
        "Ask: What is the story from your sympathetic state? Write or speak it",
        "Ask: What is the story from your dorsal vagal state? Write or speak it",
        "Ask: What is the story from your ventral vagal state? Write or speak it",
        "Read all three stories aloud to yourself",
        "Notice how the same event creates completely different narratives depending on your state",
        "Practice this with other experiences to build state awareness"
      ],
      duration: 10,
      instructions: "Discover how your autonomic state shapes the stories you tell about your experiences",
      source: "Polyvagal Exercises (Deb Dana)"
    },
    {
      id: 'PV-009',
      title: "Resourcing with the Vagal Brake",
      steps: [
        "Stand with feet slightly apart. Identify one foot as ventral, the other as sympathetic",
        "Shift balance between feet—feel the vagal brake relaxing and re-engaging",
        "Play with the edges of balance, keeping the ventral foot grounded",
        "Choose an image for your vagal brake (bicycle brakes, a faucet, a gate, a bridge)",
        "Use the image to follow the natural breath cycle: brake relaxes on inhale, re-engages on exhale",
        "Bring breath, body, and image together for several cycles",
        "Now use the image to meet a small challenge (1-4 on a 1-10 scale)",
        "Feel your ability to rise to the challenge while staying regulated"
      ],
      duration: 8,
      instructions: "Build skill in using your vagal brake as a resource. Like exercising a muscle, this builds autonomic flexibility",
      source: "Polyvagal Exercises (Deb Dana)"
    },
    {
      id: 'PV-010',
      title: "Energy and Actions Map",
      steps: [
        "For each autonomic state, create a map with a line from 'passive' to 'active'",
        "Split each side: left = self-regulating actions, right = co-regulating actions",
        "For DORSAL: What passive or active actions move you toward ventral? (self and co-regulating)",
        "For SYMPATHETIC: What passive or active actions safely discharge energy? (self and co-regulating)",
        "For VENTRAL: What passive or active actions deepen safety and connection?",
        "Match resources to available energy—don't prescribe active resources when energy is low",
        "Update your maps as you discover new resources"
      ],
      duration: 15,
      instructions: "Build a personalized toolkit matching resources to each state. Like Goldilocks: find the resource that's 'just right' for the energy available",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'PV-011',
      title: "Reflecting with Compassion (Personalized Metta)",
      steps: [
        "Look at the four traditional categories: happy, healthy, safe, and living with ease",
        "Write your own four phrases using autonomic language that resonates",
        "Example: 'May I find glimmers every day. May I be nourished by ventral energy. May I be filled with safety. May I live in the rhythm of regulation.'",
        "Say your phrases out loud. Feel how they land in your system",
        "Say the phrases to yourself ('May I'), then to someone safe ('May you'), then to a neutral person, then to someone difficult, then to all beings",
        "Share your phrases with someone and have them read them back to you",
        "Notice the autonomic response to offering and receiving compassion"
      ],
      duration: 8,
      instructions: "A polyvagal adaptation of loving-kindness meditation. Finding your own language strengthens the autonomic connection",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'PV-012',
      title: "Continuum Between Survival and Social Engagement",
      steps: [
        "Draw a horizontal line. Label one end 'Protection/Disconnection' and the other 'Connection/Engagement'",
        "Start at either end. Identify the first small step toward the other end",
        "Mark small steps along the way—what does each incremental shift feel like?",
        "Mark the midpoint where you feel the larger shift from protection to connection",
        "Practice placing yourself on the continuum throughout the day",
        "Use the midpoint to quickly assess: Am I on the side of protection or connection?",
        "Notice how you are always moving along this continuum"
      ],
      duration: 10,
      instructions: "Move away from all-or-nothing thinking about your autonomic states by mapping the gradual shifts between survival and connection",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'PV-013',
      title: "Four Steps to Planning (Ventral-Anchored)",
      steps: [
        "SET THE INTENTION: Write your intention. Play with words until your ventral vagal system feels fully invested",
        "CREATE AN IMAGE: Use outcome visualization (seeing the goal reached), process visualization (steps along the way), and critical visualization (challenges you'll face)",
        "WRITE YOUR PLAN: In a format that feels clear—outline, paragraphs, or illustrated. Let your nervous system guide the format",
        "SHARE IT: Find someone safe to share your plan with. Track your autonomic response as you tell it. Adjust based on what you notice"
      ],
      duration: 15,
      instructions: "Create ventral vagal-inspired plans using nervous system awareness at each step",
      source: "Polyvagal Exercises (Deb Dana)"
    },
    {
      id: 'PV-014',
      title: "Create If-Then Statements",
      steps: [
        "Identify a common trigger that takes you out of ventral vagal regulation",
        "Name the state you typically move into (sympathetic or dorsal)",
        "Create an if-then statement: 'If [trigger happens], then I will [regulating action]'",
        "Make the 'then' action specific and doable in the moment",
        "Examples: 'If I notice my jaw clenching, then I will take 3 long exhales'",
        "'If I feel the urge to withdraw, then I will text one safe person'",
        "Practice your if-then statements until they become automatic"
      ],
      duration: 10,
      instructions: "Pre-program regulatory responses to common triggers. If-then planning bridges the gap between awareness and action",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'PV-015',
      title: "The Music in Your Life",
      steps: [
        "Create a playlist for each autonomic state",
        "VENTRAL: Songs that bring feelings of joy, connection, calm, or playfulness",
        "SYMPATHETIC: Songs that match the intensity of activation (for discharge) or songs that calm",
        "DORSAL: Songs that gently bring energy and movement back",
        "Notice how different music shifts your autonomic state",
        "Use your playlists intentionally as regulating resources",
        "Update your playlists as you discover new songs that shape your system"
      ],
      duration: 15,
      instructions: "Music is a powerful autonomic shaper. Rhythm, melody, and lyrics all influence nervous system state",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'PV-016',
      title: "Neuroception Notebook",
      steps: [
        "Start a dedicated notebook or section in your journal",
        "Throughout the day, note moments when your neuroception shifts",
        "Record: What cue did you detect? (a person, place, sound, sensation)",
        "Was it a cue of safety, danger, or life-threat?",
        "What state shift did it trigger?",
        "Was the neuroception accurate or was it a 'faulty neuroception'?",
        "Over time, patterns will emerge showing your neuroception tendencies"
      ],
      duration: 5,
      instructions: "Track the moments your nervous system detects cues of safety or danger, building awareness of your neuroception patterns",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
  ],

  // ============================================================
  // PARTS WORK (IFS) EXERCISES
  // ============================================================
  partsWork: [
    {
      id: 'IFS-001',
      title: "Parts Check-in for Integration",
      steps: [
        "Take a moment to close your eyes and look inside",
        "What part of you feels most active or present right now?",
        "Notice where you feel this part in your body",
        "What does this part need from you right now?",
        "How does this part relate to your psychedelic insights?",
        "What would help this part feel heard and supported?",
        "Thank this part for its wisdom and protection"
      ],
      duration: 7,
      instructions: "Internal Family Systems practice to understand how different parts are responding to your insights",
      source: "App original"
    },
    {
      id: 'IFS-002',
      title: "Protector Appreciation",
      steps: [
        "Identify a protective part that feels active (inner critic, perfectionist, controller)",
        "Ask: How old were you when you took on this job?",
        "Ask: What are you trying to protect me from?",
        "Thank this part for working so hard to keep you safe",
        "Ask: What would you rather be doing if you didn't have to protect me?",
        "Tell this part: I see you, I appreciate you, and I'm learning to help you",
        "Notice how this part responds"
      ],
      duration: 10,
      instructions: "Build appreciation for protective parts, often through difficult behaviors",
      source: "App original"
    },
    {
      id: 'IFS-003',
      title: "The Six F's Protocol",
      steps: [
        "FIND the part: How does it manifest? (thought, emotion, sensation, image) Where in your body?",
        "FOCUS on it: Stay with it. Notice what it's like. Are there words that go with it?",
        "FLESH it out: Ask what it wants you to know, what it wants you to do, what its job is",
        "FEEL toward it: How do you feel toward this part? (Check for Self-energy—curiosity, compassion, calm)",
        "BEFRIEND it: Send care and openness. Ask how long it has had this job. Offer appreciation",
        "Find its FEARS: What is it afraid would happen if it didn't act this way? Offer hope for healing"
      ],
      duration: 15,
      instructions: "The core IFS protocol for getting to know any part. Follow these six steps to build a trusting Self-to-part relationship",
      source: "IFS Skills Training Manual"
    },
    {
      id: 'IFS-004',
      title: "Daily IFS Meditation",
      steps: [
        "Get comfortable. Take some deep breaths to go inside",
        "Focus on the parts you're getting to know. Check in with each: How are you doing? What do you need?",
        "Remind each part: 'I'm here with you. I care about you. You're not alone anymore'",
        "Let them know you're not a young child anymore—you can care for them now",
        "Expand your awareness: invite any other parts that need attention to come forward",
        "Optional: Ask each part if it would be willing to relax and open space inside, just for a few minutes",
        "Notice any shifts in spaciousness, breathing, or sense of well-being",
        "Thank your parts. Remind them you'll do this practice again"
      ],
      duration: 10,
      instructions: "A daily practice for maintaining ongoing relationships with your parts. From 'No Bad Parts' by Richard Schwartz",
      source: "No Bad Parts (Richard Schwartz)"
    },
    {
      id: 'IFS-005',
      title: "Simple Unblending Questions",
      steps: [
        "Notice if you feel 'taken over' by a part (blended)",
        "Ask the blended part: 'Would you be willing to step back into a witnessing role?'",
        "Or: 'Would you move out of my body so I can look at you?'",
        "Or: 'Would you separate from me so I can be with you from Self?'",
        "If the part is reluctant: 'What are you afraid would happen if you stepped back?'",
        "Address the fear, then ask again gently",
        "You'll know you're unblended when you feel some curiosity or compassion toward the part"
      ],
      duration: 5,
      instructions: "Quick techniques for creating separation between Self and a blended part. Self-energy returns when parts give space",
      source: "IFS Skills Training Manual"
    },
    {
      id: 'IFS-006',
      title: "Steps of Unburdening Exiles",
      steps: [
        "DIFFERENTIATION: Separate Self from the exile. Check: 'How do you feel toward this part?'",
        "TRUST-BUILDING: Ask the exile not to overwhelm you. Gradually get closer. Be fully present",
        "WITNESSING: Ask the exile to show you what it needs you to see about the past. Watch, feel, understand",
        "RETRIEVAL (optional): If the part is stuck in the past, enter the scene. Ask what it needs to leave that time",
        "UNBURDENING: Ask where the burden is in/on the body. Is it ready to release? Let it give the burden to light, water, wind, earth, or fire",
        "INVITATION: Ask what the part would like to invite in to replace the burden",
        "INTEGRATION: What does the part want to do now? Where does it want to stay? Does it feel present?"
      ],
      duration: 30,
      instructions: "The full IFS unburdening protocol. Best done with a therapist initially. Maintenance: check in with unburdened parts regularly for 2-4 weeks",
      source: "IFS Skills Training Manual"
    },
    {
      id: 'IFS-007',
      title: "Interviewing a Manager Part",
      steps: [
        "Identify a manager part (controller, planner, critic, perfectionist, people-pleaser)",
        "From Self, ask: 'What is your job in my system?'",
        "Ask: 'What are you trying to protect me from?'",
        "Ask: 'How old were you when you started this role?'",
        "Ask: 'What do you think would happen if you stopped doing this?'",
        "Ask: 'What would you rather be doing if you didn't have to manage?'",
        "Listen without judgment. Offer appreciation for its dedication"
      ],
      duration: 12,
      instructions: "Manager parts are proactive protectors. Understanding their fears and roles helps them relax their grip",
      source: "Self-Therapy Vol. 1 (Jay Earley)"
    },
    {
      id: 'IFS-007.1',
      title: "Interviewing a Firefighter Part",
      variationOf: 'IFS-007',
      steps: [
        "Identify a firefighter part (the one that reaches for substances, rage, distraction, numbing, bingeing)",
        "From Self, ask: 'What are you trying to put out? What feelings are you protecting me from?'",
        "Ask: 'What happens when that feeling breaks through?'",
        "Ask: 'How did you first learn to do this?'",
        "Ask: 'Do you know the cost of what you do?'",
        "Ask: 'What would you need from me to feel safe enough to step back?'",
        "Listen without shame or judgment. These parts are desperate protectors"
      ],
      duration: 12,
      instructions: "Firefighter parts are reactive protectors that extinguish painful feelings through extreme behaviors. Approach with curiosity, not shame",
      source: "Self-Therapy Vol. 1 (Jay Earley) / Knowing and Loving Our Firefighters (Cece Sykes)"
    },
    {
      id: 'IFS-008',
      title: "Parts Mapping",
      steps: [
        "Get a large piece of paper and colored markers",
        "In the center, draw or write 'Self'",
        "Around it, draw each part you're aware of—give each a name, color, and shape",
        "Note each part's role: protector (manager or firefighter) or exile",
        "Draw lines showing relationships between parts—who protects whom? Who conflicts with whom?",
        "Notice polarizations: parts that are in opposition to each other",
        "This map reveals the structure of your internal system"
      ],
      duration: 20,
      instructions: "Create a visual map of your internal family system. Helps identify relationships, polarizations, and alliances between parts",
      source: "Parts Work: An Illustrated Guide to Your Inner Life"
    },
  ],

  // ============================================================
  // SELF-COMPASSION EXERCISES
  // ============================================================
  selfCompassion: [
    {
      id: 'SC-001',
      title: "Self-Compassion for Integration",
      steps: [
        "Place your hands on your heart",
        "Acknowledge: 'This is a moment of learning and growth'",
        "Recognize: 'Integrating profound experiences is part of being human'",
        "Offer yourself: 'May I be kind to myself as I process this'",
        "Feel the warmth of your hands on your heart",
        "Say: 'May I give myself the compassion I need'",
        "Notice how this kindness affects your body and mind"
      ],
      duration: 5,
      instructions: "Cultivating self-compassion to support your integration journey",
      source: "App original"
    },
    {
      id: 'SC-002',
      title: "Loving-Kindness for Difficult Parts",
      steps: [
        "Think of a part of yourself you struggle with or judge",
        "Place your hand on your heart",
        "Say to this part: 'May you be peaceful'",
        "Say: 'May you be free from suffering'",
        "Say: 'May you know you are loved'",
        "Say: 'May you trust that you belong'",
        "Notice any softening or resistance, without judgment"
      ],
      duration: 6,
      instructions: "Extend compassion to the parts of yourself that are hardest to love",
      source: "App original"
    },
    {
      id: 'SC-003',
      title: "Tonglen (Giving and Taking Meditation)",
      steps: [
        "Sit quietly and connect with a feeling of compassion",
        "Think of someone who is suffering (or your own suffering)",
        "On the IN-breath: Breathe in their suffering as dark, heavy smoke",
        "Imagine it dissolving in the vast, open space of your heart",
        "On the OUT-breath: Send out relief, healing, and light",
        "Continue for several minutes, breathing in suffering, sending out relief",
        "Expand gradually: from one person to many, to all beings who suffer in this way"
      ],
      duration: 10,
      instructions: "Ancient Tibetan Buddhist practice of breathing in suffering and sending out compassion. Builds courage and dissolves self-centeredness",
      source: "Tonglen (Buddhist tradition)"
    },
    {
      id: 'SC-004',
      title: "Gratitude as Antidote",
      steps: [
        "When negative thoughts spiral, pause and shift to gratitude deliberately",
        "Name specific things you're grateful for — especially things you normally take for granted",
        "Include absences: pain you're not in, losses you haven't suffered. Really feel each one",
        "Use different items each time. The slight effort of searching for new ones is part of the practice",
        "After 30 seconds of naming, stop thinking and focus on the physical sensation of gratitude",
        "Notice where you feel it in your body — often a warmth or softening in the chest",
        "Stay with that feeling. Gratitude isn't just a thought — it's a body state that crowds out negativity"
      ],
      duration: 3,
      instructions: "For breaking negative thought spirals. Gratitude is a somatic state, not just a cognitive exercise — feeling it in the body is what shifts your nervous system",
      source: "App original — inspired by positive psychology and contemplative gratitude practices"
    },
    {
      id: 'SC-005',
      title: "Compassionate Connections",
      steps: [
        "Bring to mind someone you know who is suffering",
        "Notice your autonomic response—what happens in your body?",
        "From a ventral vagal state, feel compassion arise naturally",
        "Send a silent wish: 'May you find your way to safety and connection'",
        "Now bring to mind someone you feel neutral about. Send the same wish",
        "Now bring to mind someone difficult. Notice your autonomic shift",
        "From ventral, send the wish: 'May you find your way to safety and connection'",
        "Notice how offering compassion from regulation shapes your own system"
      ],
      duration: 8,
      instructions: "Compassion practice grounded in autonomic awareness. Sending compassion from ventral vagal state strengthens your own regulation",
      source: "Polyvagal Exercises for Safety and Connection (Deb Dana)"
    },
    {
      id: 'SC-006',
      title: "Self-Compassion Break (Kristin Neff)",
      steps: [
        "When you notice you're suffering, pause and acknowledge it: 'This is a moment of suffering'",
        "Remind yourself this is part of the shared human experience: 'Suffering is part of life'",
        "Place your hands over your heart, or wherever feels soothing",
        "Say to yourself: 'May I be kind to myself in this moment'",
        "Or choose your own words: 'May I give myself the compassion I need'",
        "Feel the warmth of your hands and the intention of kindness",
        "Stay here until you feel a shift, then carry this kindness forward"
      ],
      duration: 3,
      instructions: "Kristin Neff's three components of self-compassion: mindfulness, common humanity, and self-kindness",
      source: "Self-Compassion (Kristin Neff) / Practicing Mindfulness"
    },
    {
      id: 'SC-007',
      title: "Compassionate Letter to Yourself",
      steps: [
        "Think of something you're struggling with or judging yourself for",
        "Now imagine a deeply wise, unconditionally loving friend",
        "Write a letter to yourself from that friend's perspective",
        "What would they say about your situation? How would they acknowledge your pain?",
        "What would they remind you about your strength and goodness?",
        "Read the letter aloud to yourself. Let the words land in your body",
        "Keep this letter and re-read it when your inner critic is loud"
      ],
      duration: 15,
      instructions: "Externalizing compassion through writing bypasses the inner critic and creates a tangible resource you can return to",
      source: "Practicing Mindfulness / Good Inside"
    },
    {
      id: 'SC-008',
      title: "Soften-Soothe-Allow",
      steps: [
        "Bring to mind a difficult situation causing mild to moderate stress",
        "Notice where you feel it in your body. Name the sensation",
        "SOFTEN: Soften around that area. Don't resist. Let the muscles release",
        "SOOTHE: Place your hand on the area or heart. Speak kindly: 'It's okay. I'm here'",
        "ALLOW: Allow the feeling to be present without trying to fix or change it",
        "Breathe with the feeling for a few minutes",
        "Notice any shifts. You don't need to make the feeling go away—just be with it"
      ],
      duration: 10,
      instructions: "A mindful self-compassion practice that teaches you to be with difficult emotions rather than fighting or avoiding them",
      source: "Practicing Mindfulness / Self-Compassion (Kristin Neff)"
    },
  ],

  // ============================================================
  // MEDITATION EXERCISES
  // ============================================================
  meditation: [
    {
      id: 'MED-001',
      title: "Basic Mindfulness Meditation",
      steps: [
        "Sit comfortably with your back straight but not rigid",
        "Close your eyes or soften your gaze",
        "Bring attention to the sensation of breathing at the nostrils or belly",
        "When your mind wanders (it will), gently return attention to the breath",
        "Don't judge the wandering—each return is a moment of mindfulness",
        "Start with 5 minutes and gradually increase",
        "End by opening your eyes and noticing your surroundings"
      ],
      duration: 5,
      instructions: "The foundational mindfulness practice. Training attention and developing a non-judgmental relationship with your mind",
      source: "Practicing Mindfulness (Matthew Sockolov)"
    },
    {
      id: 'MED-002',
      title: "Body Scan Meditation",
      steps: [
        "Lie down or sit comfortably. Close your eyes",
        "Bring attention to the top of your head. Notice any sensations without judgment",
        "Slowly move attention down: forehead, eyes, cheeks, jaw, neck",
        "Continue through shoulders, arms, hands, fingers",
        "Scan through chest, upper back, belly, lower back",
        "Continue through hips, thighs, knees, calves, feet, toes",
        "If you find areas of tension or sensation, breathe into them",
        "End by feeling the whole body as one integrated field of sensation"
      ],
      duration: 15,
      instructions: "Systematic body awareness meditation that develops interoception and releases held tension",
      source: "Real Happiness (Sharon Salzberg)"
    },
    {
      id: 'MED-003',
      title: "Lovingkindness (Metta) Meditation",
      steps: [
        "Sit comfortably. Bring to mind someone you love easily",
        "Silently repeat: 'May you be happy. May you be healthy. May you be safe. May you live with ease.'",
        "Feel the warmth of these wishes in your heart",
        "Now direct the phrases to yourself: 'May I be happy. May I be healthy...'",
        "Extend to a neutral person (someone you neither like nor dislike)",
        "Extend to a difficult person (start with mildly difficult)",
        "Finally, extend to all beings everywhere: 'May all beings be happy...'"
      ],
      duration: 15,
      instructions: "Traditional lovingkindness meditation that systematically cultivates goodwill toward self and others",
      source: "Lovingkindness (Sharon Salzberg)"
    },
    {
      id: 'MED-004',
      title: "Noting Practice",
      steps: [
        "Sit in meditation posture with eyes closed",
        "As thoughts, feelings, or sensations arise, silently 'note' them",
        "Use simple labels: 'thinking,' 'feeling,' 'hearing,' 'itching,' 'planning,' 'remembering'",
        "Note without getting caught up in the content",
        "After noting, return to the breath or open awareness",
        "This creates space between you and your experience",
        "Practice for 10-20 minutes"
      ],
      duration: 15,
      instructions: "Vipassana-style noting practice that develops equanimity by labeling experience without attachment",
      source: "Practicing Mindfulness (Matthew Sockolov)"
    },
    {
      id: 'MED-005',
      title: "Walking Meditation",
      steps: [
        "Find a path of about 20-30 feet. Stand at one end",
        "Feel your feet on the ground. Set an intention to be present",
        "Begin walking slowly—much slower than normal",
        "Notice each component: lifting, moving, placing each foot",
        "Feel the shift of weight from one foot to the other",
        "When you reach the end, pause. Turn slowly. Walk back",
        "If your mind wanders, pause, re-connect with feet, continue",
        "Practice for 10-20 minutes"
      ],
      duration: 15,
      instructions: "Meditation in motion. Especially useful when sitting meditation feels too still or when your body needs to move",
      source: "Practicing Mindfulness / Real Happiness"
    },
    {
      id: 'MED-006',
      title: "Open Awareness Meditation",
      steps: [
        "Sit comfortably. Begin with a few minutes of breath awareness",
        "Gradually open your attention to include all sounds",
        "Expand to include body sensations, emotions, thoughts",
        "Let awareness be like the sky—vast, open, holding everything",
        "Don't follow any particular experience. Let them arise and pass",
        "Rest in the awareness itself, not in any object of awareness",
        "If you get lost in thought, return to breath briefly, then open again"
      ],
      duration: 15,
      instructions: "Non-directive meditation that rests in awareness itself rather than focusing on any particular object",
      source: "Meditation: How to Meditate (Pema Chodron)"
    },
    {
      id: 'MED-007',
      title: "Bare Attention Meditation (Vipassana)",
      steps: [
        "Sit with spine erect. Close your eyes and take a few deep breaths",
        "Feel the points of contact between your body and the chair or floor",
        "Bring attention to the nostrils. Notice the subtle sensations of air passing in and out",
        "Feel cooler air on inhale, warmer on exhale. Be the gatekeeper, just watching the breath pass",
        "When your mind wanders (it will), gently note 'thinking' and return to the breath",
        "As you stabilize, begin to notice all objects of consciousness as they arise and pass: sounds, sensations, emotions",
        "The goal is not to stop thinking, but to notice when you're lost in thought"
      ],
      duration: 20,
      instructions: "The classic vipassana instruction. The problem is not thoughts but thinking without knowing you're thinking",
      source: "Mindfulness Meditation (Sam Harris) / Waking Up"
    },
    {
      id: 'MED-008',
      title: "Concentration Meditation (Samatha)",
      steps: [
        "Sit comfortably with your eyes closed",
        "Choose a single object of focus: the breath at the nostrils, a candle flame, or a mantra",
        "Hold your attention on this object with gentle but steady focus",
        "When attention drifts, notice that, and calmly return to the object",
        "Don't fight distractions—simply choose the object again each time",
        "Over time, the mind becomes still. This stillness is the beginning of deeper states",
        "Practice for 10-30 minutes, gradually extending duration"
      ],
      duration: 20,
      instructions: "Samatha meditation builds the 'muscle' of concentration. It's the foundation for all other meditation practices",
      source: "The Mind Illuminated / Right Concentration"
    },
    {
      id: 'MED-009',
      title: "Equanimity Meditation",
      steps: [
        "Sit quietly and settle your attention on the breath",
        "Bring to mind someone you feel neutral about—a stranger you passed today",
        "Reflect: this person, like me, wants to be happy and free from suffering",
        "Now bring to mind someone you love. Send the same wish",
        "Now someone you find difficult. Can you hold the same wish for them?",
        "The phrase: 'May all beings be happy, whether I like them or not'",
        "Rest in the spacious quality of equanimity—caring without grasping"
      ],
      duration: 15,
      instructions: "Equanimity (upekkha) is the fourth Brahma Vihara—the balanced heart that can hold all experience with grace",
      source: "In the Buddha's Words / Real Happiness"
    },
    {
      id: 'MED-010',
      title: "Inner Smile Meditation",
      steps: [
        "Sit comfortably and close your eyes. Relax your face",
        "Bring a gentle smile to your lips—not forced, just a slight upward turn",
        "Now imagine this smile spreading inward, to your eyes, your brain",
        "Let the smile energy flow down to your heart. Feel it warm and soften",
        "Continue sending the smile to each organ: lungs, liver, kidneys, stomach",
        "Let the smile fill your entire body like warm golden light",
        "Rest in this feeling of inner warmth and benevolence for 5-10 minutes"
      ],
      duration: 10,
      instructions: "A Taoist meditation that generates positive energy through internally directing a smile to the organs and body",
      source: "The Inner Smile (Mantak Chia)"
    },
    {
      id: 'MED-011',
      title: "Just Sitting (Shikantaza)",
      steps: [
        "Sit in an upright, relaxed posture. Eyes slightly open, gaze downward",
        "Don't focus on anything in particular—not the breath, not sounds",
        "Just sit. Let whatever arises in your experience come and go",
        "Don't manipulate your attention. Don't try to achieve anything",
        "If you notice you're lost in thought, simply return to just sitting",
        "This is the most open form of meditation—pure awareness without object",
        "Practice for 15-30 minutes"
      ],
      duration: 20,
      instructions: "Shikantaza is the Zen practice of 'just sitting'—goalless awareness. Paradoxically, having no aim is the aim",
      source: "108 Meditation Instructions"
    },
  ],

  // ============================================================
  // JUNGIAN / DEPTH PSYCHOLOGY VISUALIZATION
  // ============================================================
  jungian: [
    {
      id: 'JU-001',
      title: "Moving Toward Discomfort",
      steps: [
        "Identify something you've been avoiding — a conversation, a task, a feeling",
        "Close your eyes. Visualize that discomfort as a shape or presence in front of you",
        "Instead of turning away, take a step toward it in your mind. Welcome it",
        "Notice: the resistance itself is what causes most of your suffering, not the thing you're avoiding",
        "Breathe into the discomfort. Let it be present without trying to fix it",
        "Visualize yourself moving through it and arriving on the other side, lighter",
        "Open your eyes. Take one small action toward the thing you've been avoiding"
      ],
      duration: 2,
      instructions: "For overcoming avoidance and procrastination. The paradox: willingly approaching discomfort dissolves its power over you",
      source: "App original — inspired by exposure-based and depth psychology principles"
    },
    {
      id: 'JU-002',
      title: "Compassion for Difficult People",
      steps: [
        "Bring to mind someone who has angered or hurt you",
        "Notice the tension in your body — the grip of resentment. Acknowledge it",
        "Now shift your attention to your heart. Place a hand on your chest if it helps",
        "Imagine warmth expanding from your chest outward, like radiating heat",
        "Direct that warmth toward the difficult person. You're not condoning their behavior — you're freeing yourself",
        "Notice: sending compassion outward loosens the constriction inside you",
        "Rest in whatever openness is available. Resentment harms the one who holds it most"
      ],
      duration: 2,
      instructions: "For anger and resentment. Directing compassion outward — even toward someone who wronged you — breaks the cycle of rumination and frees your own energy",
      source: "App original — inspired by loving-kindness and depth psychology traditions"
    },
    {
      id: 'JU-003',
      title: "Reclaiming Your Shadow",
      steps: [
        "Think of a situation where you feel insecure, small, or silenced",
        "Imagine the parts of yourself you hide — the messy, intense, 'unacceptable' parts",
        "Visualize those parts as a figure standing beside you. This is your shadow self",
        "Instead of pushing it away, acknowledge it: 'You are part of me. I need your strength'",
        "Feel what it's like to stand with all of yourself — not just the polished version",
        "Now turn toward the situation that intimidated you. Notice how much more grounded you feel",
        "Your full self — light and shadow together — speaks with more authority than the curated version ever could"
      ],
      duration: 2,
      instructions: "For insecurity and performance anxiety. Jungian shadow integration: the traits you reject hold buried power. Welcoming them back makes you whole",
      source: "App original — inspired by Jungian shadow work"
    },
    {
      id: 'JU-004',
      title: "Mortality Reflection",
      steps: [
        "Close your eyes. Imagine yourself at the very end of your life, looking back",
        "From that vantage point, ask: 'What did I spend my time on? What did I avoid?'",
        "Notice any regret that arises — not to punish yourself, but to clarify what matters",
        "Let the awareness of limited time create urgency, not anxiety",
        "Ask your future self: 'What would you tell me to do right now?'",
        "Listen. The answer is usually simple and clear",
        "Open your eyes and take one action aligned with that clarity"
      ],
      duration: 2,
      instructions: "Memento mori — the ancient practice of reflecting on mortality to clarify what matters. Creates willpower by making the cost of inaction vivid",
      source: "App original — inspired by Stoic memento mori and existential psychology"
    },
    {
      id: 'JU-005',
      title: "Transforming Craving into Fullness",
      steps: [
        "Notice the craving or impulse pulling at you — the urge to check, consume, react",
        "Instead of acting on it, pause. Feel the wanting fully without satisfying it",
        "Let the wanting deepen. Beneath it you'll find a raw emptiness. Stay with it",
        "Breathe into that emptiness. Rather than a void to fill, see it as open space",
        "Imagine warmth rising from within that space — your own inner vitality, not dependent on anything external",
        "Let that warmth expand until it feels larger than the craving",
        "From this fullness, notice: the impulse has less grip. You are already enough"
      ],
      duration: 3,
      instructions: "For impulse control and cravings. The practice of sitting with wanting — without acting — reveals that the emptiness beneath craving can become a source of energy",
      source: "App original — inspired by depth psychology and contemplative traditions"
    },
    {
      id: 'JU-006',
      title: "Drawing Energy from Overwhelm",
      steps: [
        "Acknowledge the exhaustion. Say to yourself: 'I am depleted right now. That's real'",
        "Close your eyes. Imagine you can call on something larger than your personal energy — the life force itself",
        "Silently ask for help. You don't need to know who or what you're asking",
        "Visualize energy entering through the top of your head, warm and steady",
        "Let it fill your body from head to feet. Feel yourself straightening, expanding",
        "Imagine standing taller than your problems — seeing them from a higher vantage point",
        "Move slowly and deliberately. Energy comes from engaging with life, not withdrawing from it"
      ],
      duration: 2,
      instructions: "For depletion and overwhelm. When personal energy is exhausted, this visualization connects you to a sense of larger vitality beyond ego resources",
      source: "App original — inspired by visualization and transpersonal psychology"
    },
    {
      id: 'JU-007',
      title: "The Nurturing Presence",
      steps: [
        "Notice the hopelessness or despair you're carrying. Don't resist it — feel its weight",
        "Externalize it: imagine the heavy feeling as a dark substance you can set down",
        "Now imagine a nurturing presence — an archetype of unconditional care. This could be a wise elder, a loving figure, or simply a warm light",
        "This presence sees you completely and believes in you without reservation",
        "Imagine the heavy feeling lifting from you, absorbed by this presence effortlessly",
        "Feel their confidence in you. Let it fill the space where the despair was",
        "Rest in this. Even a moment of feeling believed in can shift what feels possible"
      ],
      duration: 3,
      instructions: "For hopelessness and despair. Archetypal visualization of unconditional support. Accessing the inner 'good parent' archetype restores hope when personal reserves are empty",
      source: "App original — inspired by Jungian archetypes and attachment theory"
    },
    {
      id: 'JU-008',
      title: "Symbolic Death and Renewal",
      steps: [
        "Bring to mind a wound you keep reliving — a betrayal, a loss, a deep hurt",
        "Feel it fully. Let the pain be as big as it wants to be for a moment",
        "Now imagine that the old version of you — the one defined by this wound — can be released",
        "Visualize laying that identity down. It served you, but you are more than your injuries",
        "Feel a lightness where the weight was. Imagine light filling your body from the inside",
        "Sense yourself rising above the story of the wound — not denying it, but no longer trapped in it",
        "You are not what happened to you. You are what you choose to become"
      ],
      duration: 3,
      instructions: "For being stuck in victimhood after being hurt. Symbolic 'death and rebirth' visualization — a universal motif across cultures — helps you release identification with old wounds",
      source: "App original — inspired by death/rebirth archetypes across mythological and depth psychology traditions"
    },
  ],

  // ============================================================
  // COGNITIVE / BELIEFS WORK
  // ============================================================
  cbt: [
    {
      id: 'CBT-001',
      title: "Thought Record",
      steps: [
        "Identify the situation that triggered a strong emotion",
        "Name the emotion(s) and rate intensity (0-100%)",
        "Write the automatic thought: What went through your mind?",
        "Identify the cognitive distortion (all-or-nothing, catastrophizing, mind-reading, etc.)",
        "Challenge: What evidence supports this thought? What evidence contradicts it?",
        "Create a balanced alternative thought",
        "Re-rate the original emotion (0-100%). Notice any shift"
      ],
      duration: 10,
      instructions: "The foundational CBT exercise for identifying and restructuring unhelpful thought patterns",
      source: "CBT Workbook for Therapists"
    },
    {
      id: 'CBT-002',
      title: "Core Belief Identification",
      steps: [
        "Start with a recent automatic negative thought",
        "Use the downward arrow technique: 'If that were true, what would it mean about me?'",
        "Keep asking 'And what would that mean?' until you reach a fundamental belief",
        "Common core beliefs: 'I am unlovable,' 'I am inadequate,' 'I am unsafe,' 'I am defective'",
        "Rate how strongly you believe this right now (0-100%)",
        "Write evidence that contradicts this core belief",
        "Create an alternative, more balanced core belief"
      ],
      duration: 15,
      instructions: "Uncover the deepest beliefs driving your emotional reactions. Core beliefs often form in childhood and operate automatically",
      source: "Core Beliefs, Harnessing the Power"
    },
    {
      id: 'CBT-003',
      title: "Cognitive Distortion Spotting",
      steps: [
        "Review the list of common distortions: All-or-Nothing, Catastrophizing, Mind Reading, Fortune Telling, Emotional Reasoning, Should Statements, Labeling, Personalization, Mental Filter, Discounting Positives",
        "Throughout the day, notice when your thinking falls into one of these patterns",
        "Name the distortion: 'I notice I'm catastrophizing right now'",
        "Ask: 'What would a balanced view look like?'",
        "Notice how naming the distortion creates distance from the thought",
        "Keep a tally: which distortions show up most for you?",
        "This builds awareness of your habitual thinking patterns"
      ],
      duration: 5,
      instructions: "Build a habit of recognizing cognitive distortions as they happen. Naming them reduces their power",
      source: "MindWorks / CBT Workbook for Therapists"
    },
    {
      id: 'CBT-004',
      title: "Behavioral Experiment",
      steps: [
        "Identify a belief you want to test (e.g., 'If I speak up, people will reject me')",
        "Make a specific prediction: What exactly do you think will happen?",
        "Design a small experiment to test the prediction",
        "Rate your anxiety before (0-100%)",
        "Carry out the experiment",
        "Record what actually happened—be specific",
        "Compare results to your prediction. What did you learn?"
      ],
      duration: 20,
      instructions: "Test your beliefs against reality rather than accepting them as facts. One of the most powerful CBT techniques",
      source: "CBT Workbook for Therapists"
    },
    {
      id: 'CBT-005',
      title: "Values Clarification",
      steps: [
        "Consider these life domains: Relationships, Work, Health, Growth, Creativity, Spirituality, Community",
        "For each, ask: 'What kind of person do I want to be in this area?'",
        "Write 2-3 core values that matter most to you (e.g., authenticity, courage, compassion)",
        "For each value, rate: How important is it? (1-10) How consistently am I living it? (1-10)",
        "Notice any gaps between importance and consistency",
        "Choose one value to focus on this week",
        "Identify one small action you can take today that aligns with this value"
      ],
      duration: 15,
      instructions: "ACT-based exercise for connecting with what truly matters and using values as a compass for action",
      source: "SMART Recovery Handbook"
    },
    {
      id: 'CBT-006',
      title: "Downward Arrow Technique",
      steps: [
        "Start with an automatic negative thought you've noticed",
        "Ask: 'If this were true, what would it mean about me?'",
        "Take the answer and ask again: 'And if THAT were true, what would it mean?'",
        "Keep going deeper, asking the same question 3-5 times",
        "You'll arrive at a core belief (e.g., 'I'm unlovable' or 'I'm not good enough')",
        "Now examine this core belief: What's the evidence for and against it?",
        "Create a more balanced alternative belief"
      ],
      duration: 15,
      instructions: "The downward arrow uncovers the deepest beliefs driving your automatic thoughts. Once visible, core beliefs can be examined and updated",
      source: "MindWorks / Core Beliefs (Matthew McKay)"
    },
    {
      id: 'CBT-007',
      title: "The ABCDE Model (Rational Emotive)",
      steps: [
        "A - Activating Event: What happened? Describe factually",
        "B - Belief: What did you tell yourself about this event?",
        "C - Consequence: What emotions and behaviors resulted?",
        "D - Dispute: Challenge the belief. Is it rational? What's the evidence? What would a friend say?",
        "E - Effective New Belief: Create a more balanced, realistic thought",
        "Notice how the new belief changes your emotional response",
        "Practice with small events daily to build the skill"
      ],
      duration: 10,
      instructions: "Albert Ellis's REBT model. The event doesn't cause the emotion—your belief about the event does. Change the belief, change the feeling",
      source: "The Four Thoughts That F*ck You Up / Psychitect's Toolkit"
    },
    {
      id: 'CBT-008',
      title: "Belief Testing Experiment",
      steps: [
        "Identify a belief you hold that limits you (e.g., 'If I speak up, people will reject me')",
        "State the prediction clearly: what exactly do you expect will happen?",
        "Rate your confidence in this prediction (0-100%)",
        "Design a small, safe experiment to test it (e.g., share an opinion in a meeting)",
        "Carry out the experiment. Record exactly what happens",
        "Compare the result to your prediction. Was the belief accurate?",
        "Update the belief based on evidence, not fear"
      ],
      duration: 20,
      instructions: "Behavioral experiments are the most powerful CBT technique. Real-world evidence changes beliefs faster than thought records",
      source: "MindWorks / Psychitect's Toolkit"
    },
    {
      id: 'CBT-009',
      title: "Worry Time Scheduling",
      steps: [
        "Choose a specific 15-minute 'worry window' each day (e.g., 5:00 PM)",
        "When worries arise outside this window, write them down and postpone them",
        "Say to yourself: 'I'll think about this during worry time'",
        "During your worry window, review your worry list and worry deliberately",
        "For each worry, ask: Can I do something about this? If yes, plan. If no, let it go",
        "When the 15 minutes are up, stop. Move on to a pleasant activity",
        "Over time, you'll notice many worries resolve before worry time arrives"
      ],
      duration: 15,
      instructions: "Containment technique that prevents worry from hijacking your entire day while still giving it appropriate attention",
      source: "MindWorks / The Complex PTSD Workbook"
    },
    {
      id: 'CBT-010',
      title: "Defusion from Thoughts",
      steps: [
        "Notice a recurring negative thought (e.g., 'I'm a failure')",
        "Now say it with a prefix: 'I'm having the thought that I'm a failure'",
        "Say it again: 'I notice I'm having the thought that I'm a failure'",
        "Try singing the thought to the tune of Happy Birthday",
        "Or say it in a silly cartoon voice",
        "Notice: the thought is still there, but your relationship to it has changed",
        "You are not your thoughts. You are the awareness noticing them"
      ],
      duration: 5,
      instructions: "ACT cognitive defusion technique. The goal isn't to change or stop thoughts but to change your relationship with them",
      source: "Designing the Mind / SMART Recovery"
    },
  ],

  // ============================================================
  // HABITS & BEHAVIORAL CHANGE
  // ============================================================
  habits: [
    {
      id: 'HAB-001',
      title: "Anchoring New Behaviors",
      steps: [
        "Identify a current habit you do reliably every day (e.g., making coffee, brushing teeth)",
        "Choose a new small behavior you want to build",
        "Link them: 'After I [existing habit], I will [new behavior]'",
        "Start very small — 2 minutes or less",
        "Example: 'After I pour my morning coffee, I will sit and breathe for 60 seconds'",
        "Do this consistently for at least 2 weeks before adding complexity",
        "Acknowledge each completion — even a quiet nod reinforces the pattern"
      ],
      duration: 2,
      instructions: "An existing routine becomes the cue for a new behavior. This leverages your brain's existing neural pathways rather than building from scratch",
      source: "App original — based on behavioral chaining principles from behavioral psychology"
    },
    {
      id: 'HAB-001.1',
      title: "Micro-Habit Seeding",
      variationOf: 'HAB-001',
      steps: [
        "Choose a moment that already happens daily (e.g., sitting down at your desk, finishing a meal)",
        "Attach the smallest possible version of the habit you want — absurdly small (one push-up, one breath)",
        "Write it down: 'After I [moment], I will [micro-behavior]'",
        "Immediately after doing it, celebrate — smile, nod, say 'nice' to yourself",
        "The positive emotion is what wires the habit. Repetition alone is not enough",
        "Keep it tiny for at least a week. Resist the urge to scale up too fast",
        "Let the habit grow naturally once the trigger-behavior-reward loop is automatic"
      ],
      duration: 1,
      instructions: "Emotion, not repetition, creates lasting habits. By keeping the behavior absurdly small and celebrating immediately, you wire a new neural pathway with minimal friction",
      source: "App original — based on behavioral design and positive reinforcement principles"
    },
    {
      id: 'HAB-002',
      title: "The Two-Minute Start",
      steps: [
        "Identify a habit you want to build",
        "Scale it down to a version that takes 2 minutes or less",
        "Reading: 'Read one page.' Exercise: 'Put on workout shoes.' Meditation: 'Sit on cushion for 60 seconds'",
        "Do only the 2-minute version. Stop after 2 minutes if you want to",
        "The goal is to master the art of showing up — starting is the hardest part",
        "Once showing up is automatic, gradually extend the duration",
        "A habit must be established before it can be optimized"
      ],
      duration: 2,
      instructions: "Make the barrier to entry so low you can't say no. Consistency at a tiny scale beats sporadic effort at full scale",
      source: "App original — based on behavioral activation and friction reduction principles"
    },
    {
      id: 'HAB-003',
      title: "Specific Action Planning",
      steps: [
        "Choose a behavior you want to do more consistently",
        "Write a specific plan: 'I will [behavior] at [time] in [location]'",
        "Be precise: 'I will meditate for 5 minutes at 7:00 AM in the living room chair'",
        "Anticipate obstacles: 'If [obstacle], then I will [response]'",
        "Example: 'If I oversleep, then I will meditate for 2 minutes before leaving'",
        "Post your plan where you'll see it daily",
        "Research consistently shows that specific when/where/how plans dramatically increase follow-through"
      ],
      duration: 5,
      instructions: "Vague intentions ('I should exercise more') rarely lead to action. Specifying the when, where, and how removes the decision-making that causes procrastination",
      source: "App original — based on implementation intention research (Gollwitzer, 1999)"
    },
    {
      id: 'HAB-004',
      title: "Reward Pairing",
      steps: [
        "List activities you enjoy but feel guilty about (TV, social media, snacks)",
        "List behaviors you know are good for you but tend to avoid (exercise, studying, cleaning)",
        "Pair them: 'I will only [enjoyable thing] while/after [beneficial thing]'",
        "Example: 'I will only listen to my favorite podcast while exercising'",
        "Example: 'I will only check social media after I journal for 5 minutes'",
        "Start with one pairing and practice it for a week",
        "The enjoyable activity becomes a built-in reward that pulls you toward the beneficial one"
      ],
      duration: 10,
      instructions: "Linking a desired activity to a needed one makes the needed behavior more attractive. You harness existing motivation rather than relying on willpower alone",
      source: "App original — based on Premack's principle and reinforcement scheduling from behavioral psychology"
    },
    {
      id: 'HAB-005',
      title: "Accountability Agreement",
      steps: [
        "Choose a habit you want to build and write it down clearly",
        "Define exactly when, where, and how you'll do it",
        "List specific consequences for missing your habit (e.g., donate money, do a chore you dislike)",
        "Find an accountability partner — someone who will hold you to it",
        "Both of you agree on the terms and a start date",
        "Track your habit daily and check in with your partner weekly",
        "Review and renew the agreement monthly"
      ],
      duration: 15,
      instructions: "Social accountability with real consequences dramatically increases follow-through. Making the cost of skipping immediate and visible bridges the gap between intention and action",
      source: "App original — based on commitment device research and social accountability principles"
    },
    {
      id: 'HAB-006',
      title: "Becoming Before Doing",
      steps: [
        "Instead of setting a goal ('lose 10 pounds'), choose who you want to become ('a person who moves daily')",
        "Write down this identity statement: 'I am becoming someone who...'",
        "Ask: 'What would this person do right now?'",
        "Choose the smallest possible action aligned with that identity",
        "Example: 'Someone who cares for their body would take the stairs' — so take the stairs",
        "Each small aligned action reinforces the identity. You don't need perfection, just consistency",
        "Track your aligned actions: notice how your self-image shifts over time"
      ],
      duration: 10,
      instructions: "Sustainable behavior change starts with identity, not outcomes. When your self-concept shifts, the behaviors follow naturally rather than requiring constant willpower",
      source: "App original — based on self-concept theory and identity-based motivation research"
    },
    {
      id: 'HAB-007',
      title: "Shaping Your Environment",
      steps: [
        "Choose one habit you want to build",
        "Look at your physical environment: does it make this habit easy or hard?",
        "Make the cue obvious: put your meditation cushion in plain sight, set out your journal",
        "Reduce friction: lay out exercise clothes the night before, pre-fill your water bottle",
        "Increase friction for unwanted habits: put your phone in another room, delete distracting apps",
        "Prime your space so the desired action is the easiest next step",
        "Redesign one element of your environment today and observe the effect"
      ],
      duration: 10,
      instructions: "Willpower is unreliable. Environment design makes desired behaviors the path of least resistance and unwanted behaviors harder to do by default",
      source: "App original — based on choice architecture and environmental design research"
    },
  ],

  // ============================================================
  // PSYCHEDELIC INTEGRATION
  // ============================================================
  psychedelicIntegration: [
    {
      id: 'PI-001',
      title: "Integration Journaling",
      steps: [
        "Find a quiet space within 24-48 hours of your experience",
        "Write freely about what you experienced—visions, feelings, insights, body sensations",
        "Don't censor or analyze yet—just record everything you remember",
        "Note any recurring themes, symbols, or messages",
        "Write about how you feel right now, in this moment",
        "What feels different about the world or about yourself?",
        "What questions remain? What feels unresolved?"
      ],
      duration: 20,
      instructions: "The most fundamental integration practice. Capture the experience before the details fade. Return to this journal regularly",
      source: "After the Ceremony Ends"
    },
    {
      id: 'PI-002',
      title: "Integration Intention Review",
      steps: [
        "Recall the intention you set before your experience",
        "How did the experience relate to your intention?",
        "Were there unexpected themes that emerged alongside your intention?",
        "What specific insights or understandings did you receive?",
        "How do you want to bring these insights into your daily life?",
        "Choose ONE concrete change to implement this week",
        "Write a commitment: 'Based on my experience, I will...'"
      ],
      duration: 15,
      instructions: "Connect the experience back to your original intention and translate insights into actionable changes",
      source: "The Psychedelic Explorer's Guide (James Fadiman)"
    },
    {
      id: 'PI-003',
      title: "Post-Experience Body Check-in",
      steps: [
        "Sit or lie down comfortably. Close your eyes",
        "Scan your body from head to toe, noticing any changes from before your experience",
        "Where do you feel lighter? Heavier? More open? More tender?",
        "Notice areas that feel different—they may hold integration material",
        "Breathe into any area that draws your attention",
        "Ask your body: 'What do you want me to know?'",
        "Trust whatever arises—images, emotions, memories",
        "Your body is integrating at its own pace. Honor that process"
      ],
      duration: 10,
      instructions: "The body holds experiences differently than the mind. Somatic check-ins reveal integration happening below conscious awareness",
      source: "After the Ceremony Ends"
    },
    {
      id: 'PI-004',
      title: "Insight-to-Action Bridge",
      steps: [
        "List the top 3-5 insights from your experience",
        "For each insight, ask: 'What would this look like lived out in my daily life?'",
        "Rate each: How ready am I to act on this? (1-10)",
        "Choose the one you're most ready for",
        "Break it into the smallest possible first step",
        "When will you take that step? Be specific (day, time, place)",
        "Share your plan with someone who can hold you accountable"
      ],
      duration: 15,
      instructions: "The bridge between revelation and transformation. Insights without action fade. Start with the smallest possible step",
      source: "After the Ceremony Ends / The Psychedelic Explorer's Guide"
    },
    {
      id: 'PI-005',
      title: "Difficult Experience Processing",
      steps: [
        "If your experience was challenging, know that difficult experiences often hold the most growth",
        "Write about what was difficult. Name the emotions that came up",
        "Ask: 'What was this experience trying to show me?'",
        "Notice if any parts of you are activated (a protector may be working hard)",
        "Check your nervous system: Are you in sympathetic (anxious) or dorsal (numb)?",
        "Use a regulating resource (breath, grounding, safe person) to return to ventral",
        "From a regulated state, revisit the material with curiosity rather than fear",
        "Consider talking to a trained integration therapist if the material feels too big"
      ],
      duration: 15,
      instructions: "Not all psychedelic experiences are blissful. Difficult experiences need gentle, regulated processing—not avoidance or forced meaning-making",
      source: "The Psychedelic Explorer's Guide / After the Ceremony Ends"
    },
    {
      id: 'PI-006',
      title: "Symbol and Theme Mapping",
      steps: [
        "Review your experience notes or journal from the session",
        "List all symbols, images, and recurring themes that appeared",
        "For each symbol, write your intuitive sense of its meaning",
        "Group related symbols together—notice any patterns or stories emerging",
        "Research any symbols you don't understand (mythology, dream dictionaries)",
        "Create a visual map connecting the symbols to themes in your life",
        "Return to this map weekly—meanings often deepen over time"
      ],
      duration: 20,
      instructions: "The symbolic language of psychedelic experiences often carries deep personal meaning that unfolds gradually with reflection",
      source: "After the Ceremony Ends"
    },
    {
      id: 'PI-007',
      title: "Integration Circle Check-in",
      steps: [
        "If possible, share your experience with a trusted person or integration group",
        "Begin by describing the overall feeling quality of the experience",
        "Share 2-3 key insights or moments that stand out",
        "Notice how it feels to put the experience into words",
        "Listen to others' reflections without comparing or judging",
        "What do you want to bring forward into daily life?",
        "Set one specific intention for this week based on what you learned"
      ],
      duration: 30,
      instructions: "Community integration is one of the most powerful tools. Sharing your experience helps make meaning and reduces isolation",
      source: "After the Ceremony Ends / The Psychedelic Explorer's Guide"
    },
    {
      id: 'PI-008',
      title: "Creative Expression Integration",
      steps: [
        "Choose a creative medium: drawing, painting, music, movement, poetry, or clay",
        "Set an intention: 'I will express what wants to come through from my experience'",
        "Don't plan—let the experience flow through your hands, voice, or body",
        "Work for at least 15 minutes without judging or editing",
        "When finished, step back and observe what emerged",
        "Write down any insights or feelings that arose during the creative process",
        "Some experiences are beyond words—art accesses what language cannot"
      ],
      duration: 20,
      instructions: "Creative expression bypasses the analytical mind and allows the experience to integrate through non-verbal channels",
      source: "After the Ceremony Ends"
    },
    {
      id: 'PI-009',
      title: "Before-and-After Self Portrait",
      steps: [
        "Draw or write a description of yourself before the experience",
        "Include your beliefs, fears, patterns, and self-image",
        "Now draw or write about yourself after the experience",
        "What has shifted? What remains the same?",
        "Notice areas of growth, areas of grief, areas of uncertainty",
        "Write about the gap between who you were and who you're becoming",
        "This exercise makes the internal transformation visible and concrete"
      ],
      duration: 20,
      instructions: "Making internal changes visible helps ground them in reality. This also helps identify what still needs attention in your integration process",
      source: "The Psychedelic Explorer's Guide"
    },
    {
      id: 'PI-010',
      title: "Daily Practice Commitment",
      steps: [
        "From your experience, identify one practice or change that feels essential",
        "Make it tiny: if meditation felt important, commit to 2 minutes daily",
        "Link it to an existing habit (habit stacking): 'After morning coffee, I meditate for 2 minutes'",
        "Track your practice daily for at least 30 days",
        "The insight from a profound experience means nothing without daily action",
        "When motivation fades (it will), remember WHY this practice matters",
        "Review and adjust monthly. Let the practice evolve as you do"
      ],
      duration: 5,
      instructions: "The most common integration failure is not lack of insight but lack of daily practice. Small, consistent action is how insights become transformation",
      source: "After the Ceremony Ends / behavioral psychology principles"
    },
  ],

  // ============================================================
  // YOGA / MOVEMENT PRACTICES (Trauma-Informed)
  // ============================================================
  yoga: [
    {
      id: 'YO-001',
      title: "Trauma-Informed Grounding Pose",
      steps: [
        "Stand with feet hip-width apart, arms at your sides",
        "Feel the ground beneath your feet. Notice where your weight falls",
        "Gently shift weight side to side, finding center",
        "Press feet into the ground. Notice the support coming back to you",
        "Invite a gentle bend in the knees—softness, not rigidity",
        "Notice: you are held. You are supported. You can choose to stand here",
        "Stay for 5-10 breaths, feeling stability and choice"
      ],
      duration: 3,
      instructions: "All trauma-informed yoga starts with choice and consent. You choose what to do with your body. There is no 'wrong' way",
      source: "Trauma-Informed Yoga: A Toolbox for Therapists"
    },
    {
      id: 'YO-002',
      title: "Gentle Forward Fold with Choice",
      steps: [
        "Stand or sit comfortably",
        "If it feels okay, begin to fold forward—only as far as feels good",
        "You might fold from standing, or simply bow your head while seated",
        "Notice what it's like to turn inward, to let the world fall away",
        "Keep breathing. Notice any sensations in your back body",
        "Stay for 3-5 breaths, or come up whenever you choose",
        "Notice how you feel when you return to upright"
      ],
      duration: 3,
      instructions: "Forward folds can feel safe (turning inward) or vulnerable (exposing the back). Offer choice at every step",
      source: "Trauma-Informed Yoga: A Toolbox for Therapists"
    },
    {
      id: 'YO-003',
      title: "Restorative Legs-Up-the-Wall",
      steps: [
        "Sit sideways next to a wall, then swing your legs up the wall as you lie back",
        "Scoot your hips as close to the wall as is comfortable",
        "Let your arms rest at your sides or on your belly",
        "Close your eyes if that feels okay",
        "This position activates the parasympathetic nervous system",
        "Stay for 5-15 minutes",
        "To come out, bend your knees, roll to one side, and slowly sit up"
      ],
      duration: 10,
      instructions: "One of the most powerful restorative poses for nervous system regulation. The inverted position promotes parasympathetic activation",
      source: "Trauma-Informed Yoga: A Toolbox for Therapists"
    },
    {
      id: 'YO-004',
      title: "Cat-Cow Spinal Flow",
      steps: [
        "Come to hands and knees, or do seated in a chair",
        "INHALE (Cow): Let your belly drop, chest lift, gaze forward gently",
        "EXHALE (Cat): Round your spine, tuck chin, draw belly in",
        "Move slowly, linking breath to movement",
        "Find your own rhythm—there's no right speed",
        "Notice where your spine feels stiff or fluid",
        "Continue for 8-10 rounds",
        "This gentle spinal movement activates the vagus nerve"
      ],
      duration: 3,
      instructions: "Spinal flexion/extension linked to breath. Activates the vagus nerve, which runs along the spine. Accessible from hands-and-knees or seated",
      source: "Trauma-Informed Yoga: A Toolbox for Therapists"
    },
    {
      id: 'YO-005',
      title: "Self-Hug and Rock",
      steps: [
        "Wrap your arms around yourself in a comfortable hug",
        "Let your hands rest wherever feels good—shoulders, arms, or sides",
        "Begin to gently rock side to side, or forward and back",
        "Find a rhythm that feels soothing—like rocking a child",
        "Notice the bilateral stimulation of the rocking motion",
        "Stay with this for 2-5 minutes",
        "This activates the ventral vagal system through self-touch and rhythmic movement"
      ],
      duration: 3,
      instructions: "Combines self-touch (activating oxytocin) with bilateral rhythmic movement (regulating the nervous system)",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'YO-006',
      title: "Supported Child's Pose",
      steps: [
        "Kneel on the floor (or use cushions for knee support)",
        "Fold forward, resting your forehead on the ground or a pillow",
        "Arms can extend forward or rest alongside your body",
        "Let your belly rest on or between your thighs",
        "This forward fold activates the parasympathetic nervous system",
        "Breathe deeply into your back body. Feel the expansion",
        "Stay for 1-5 minutes. Notice the calming effect of this supported fold"
      ],
      duration: 5,
      instructions: "A restorative pose that activates the vagus nerve through the forward fold and light pressure on the forehead. Very calming for hyperarousal",
      source: "Trauma-Informed Yoga: A Toolbox for Therapists"
    },
    {
      id: 'YO-007',
      title: "Mountain Pose with Intention",
      steps: [
        "Stand with feet hip-width apart, arms at your sides",
        "Press all four corners of your feet into the ground",
        "Lengthen your spine. Crown of head reaching skyward",
        "Shoulders back and down. Chest open but relaxed",
        "Set an intention: 'I am here. I am present. I am strong'",
        "Feel the paradox: rooted in the earth yet lifted toward the sky",
        "Hold for 1-2 minutes, breathing naturally. This is your foundation"
      ],
      duration: 2,
      instructions: "Mountain Pose (Tadasana) teaches physical and psychological stability. It's a posture of quiet power and presence",
      source: "Trauma-Informed Yoga: A Toolbox for Therapists"
    },
    {
      id: 'YO-008',
      title: "Constructive Rest Position",
      steps: [
        "Lie on your back with knees bent, feet flat on the floor hip-width apart",
        "Let your knees lean against each other for support",
        "Arms rest on your belly or at your sides, palms up",
        "Close your eyes. Let gravity do the work—nothing to hold up",
        "Feel the full length of your back releasing into the floor",
        "Breathe naturally. Notice the rise and fall of your belly",
        "Stay for 5-15 minutes. This is a deeply restorative neurological reset"
      ],
      duration: 10,
      instructions: "Alexander Technique position that allows the spine to decompress and the nervous system to downshift. Requires no effort at all",
      source: "Trauma-Informed Yoga: A Toolbox for Therapists"
    },
    {
      id: 'YO-009',
      title: "Gentle Twist for Vagal Toning",
      steps: [
        "Sit comfortably in a chair or on the floor",
        "On an inhale, lengthen your spine",
        "On an exhale, gently twist to the right. Place left hand on right knee",
        "Look over your right shoulder if comfortable. Breathe 3-5 breaths",
        "Inhale back to center",
        "Exhale, twist to the left. Breathe 3-5 breaths",
        "Spinal twists stimulate the vagus nerve and aid digestion. Move gently, never force"
      ],
      duration: 3,
      instructions: "Gentle spinal rotation stimulates the vagus nerve as it runs along the spine. This has a calming, regulating effect on the nervous system",
      source: "Trauma-Informed Yoga: A Toolbox for Therapists"
    },
    {
      id: 'YO-010',
      title: "Breath of Joy",
      steps: [
        "Stand with feet shoulder-width apart, knees slightly bent",
        "Three quick inhales through the nose with arm movements: arms forward, arms out to sides, arms overhead",
        "One big exhale through the mouth: swing arms down and fold forward with a 'HA!' sound",
        "Return to standing and repeat",
        "Do 5-10 rounds",
        "This generates energy and wakes up the body when feeling sluggish or dorsal",
        "Caution: skip if you have high blood pressure or are prone to panic"
      ],
      duration: 3,
      instructions: "A powerful energizing practice that shifts the nervous system from dorsal vagal (collapse/shutdown) to sympathetic and then ventral vagal",
      source: "Trauma-Informed Yoga: A Toolbox for Therapists"
    },
  ],

  // ============================================================
  // STOIC EXERCISES
  // ============================================================
  stoic: [
    {
      id: 'ST-001',
      title: "Negative Visualization (Premeditatio Malorum)",
      steps: [
        "Sit quietly and close your eyes",
        "Imagine losing something you value deeply—a relationship, your health, your job",
        "Don't dwell in fear—observe the feeling with curiosity",
        "Now open your eyes and notice: you still have it",
        "Feel the gratitude that arises from this contrast",
        "Resolve to appreciate what you have more fully today",
        "Practice this briefly each morning to build resilience"
      ],
      duration: 5,
      instructions: "The Stoics practiced imagining loss to deepen appreciation for what they have and reduce anxiety about the future",
      source: "20+ Stoic Exercises (NJlifehacks)"
    },
    {
      id: 'ST-002',
      title: "View From Above (Cosmic Perspective)",
      steps: [
        "Close your eyes and imagine yourself sitting where you are",
        "Now zoom out—see your building, then your city from above",
        "Keep zooming: your country, the continent, the whole Earth",
        "See the Earth as a tiny dot in the vast cosmos",
        "From this perspective, how significant are your current worries?",
        "Hold this cosmic perspective for a moment",
        "Return to your body, carrying a sense of proportion with you"
      ],
      duration: 5,
      instructions: "Marcus Aurelius practiced this to maintain perspective. It reduces the intensity of everyday problems",
      source: "Stoic Spiritual Exercises"
    },
    {
      id: 'ST-003',
      title: "Voluntary Discomfort",
      steps: [
        "Choose a small discomfort to practice today (cold shower, fasting a meal, sleeping on the floor)",
        "Before you begin, remind yourself: this is training, not punishment",
        "Notice the initial resistance—observe it without acting on it",
        "Stay with the discomfort for the chosen duration",
        "Notice: you survived. It wasn't as bad as your mind predicted",
        "Reflect on what you learned about your relationship to comfort",
        "Practice regularly to build tolerance and reduce fear of hardship"
      ],
      duration: 10,
      instructions: "Seneca recommended practicing poverty and discomfort to reduce fear of loss and build inner strength",
      source: "20+ Stoic Exercises (NJlifehacks)"
    },
    {
      id: 'ST-004',
      title: "Morning Stoic Preparation",
      steps: [
        "Each morning, before checking your phone, sit for 2 minutes",
        "Remind yourself: 'Today I will encounter difficult people and situations'",
        "Recall that others act from ignorance, not malice",
        "Set an intention: 'I will respond with wisdom, not reaction'",
        "Choose one virtue to focus on today: courage, justice, temperance, or wisdom",
        "Visualize yourself embodying that virtue in a likely challenging moment",
        "Begin your day with this clarity of purpose"
      ],
      duration: 3,
      instructions: "Marcus Aurelius wrote his Meditations as morning preparation. This exercise primes you for wise response rather than reaction",
      source: "Stoic Spiritual Exercises"
    },
    {
      id: 'ST-005',
      title: "Evening Stoic Review",
      steps: [
        "At the end of your day, sit quietly for 5 minutes",
        "Review your day: What went well? Where did you act in alignment with your values?",
        "Where did you fall short? What triggered reactive behavior?",
        "Don't judge yourself—observe with curiosity, like a scientist",
        "Ask: What would a wise person have done differently?",
        "Note one thing you want to practice tomorrow",
        "Release the day with self-compassion—each day is practice"
      ],
      duration: 5,
      instructions: "Seneca practiced nightly self-examination. This builds self-awareness without self-judgment",
      source: "20+ Stoic Exercises (NJlifehacks)"
    },
    {
      id: 'ST-006',
      title: "Dichotomy of Control",
      steps: [
        "Write down something that's causing you stress or anxiety",
        "Draw two columns: 'Within My Control' and 'Outside My Control'",
        "Sort every aspect of the situation into one column",
        "For items in your control: what specific action can you take?",
        "For items outside your control: practice acceptance—release them",
        "Notice how your stress changes when you focus only on what you can influence",
        "Return to this exercise whenever anxiety arises"
      ],
      duration: 10,
      instructions: "Epictetus taught that suffering comes from trying to control what we cannot. This exercise clarifies where to focus your energy",
      source: "Stoic Toolkit"
    },
    {
      id: 'ST-007',
      title: "Memento Mori Reflection",
      steps: [
        "Sit quietly and contemplate: one day, this life will end",
        "Not with fear—with clarity. This is simply true for everyone",
        "Ask yourself: If this were my last day, what would matter most?",
        "Am I living in alignment with what truly matters?",
        "What would I regret not doing, not saying, not being?",
        "Let this awareness bring urgency to what's important",
        "Carry this perspective gently through your day"
      ],
      duration: 5,
      instructions: "The Stoics meditated on death not to create fear, but to clarify priorities and live with intention",
      source: "Memento Mori / Stoic Spiritual Exercises"
    },
    {
      id: 'ST-008',
      title: "Amor Fati (Love of Fate)",
      steps: [
        "Think of a difficult situation you're currently facing",
        "Instead of wishing it away, try saying: 'This is exactly what I need'",
        "Ask: What can this teach me? How can it make me stronger?",
        "Imagine embracing this challenge as if you chose it",
        "Notice how your relationship to the difficulty shifts",
        "Practice seeing obstacles as training rather than punishment",
        "Repeat the affirmation: 'Everything that happens is fuel for growth'"
      ],
      duration: 5,
      instructions: "The Stoic practice of loving one's fate transforms suffering into purpose. Not passive acceptance, but active embrace",
      source: "Stoic Spiritual Exercises"
    },
  ],

  // ============================================================
  // TRAUMA RECOVERY EXERCISES
  // ============================================================
  trauma: [
    {
      id: 'TR-001',
      title: "Window of Tolerance Check-in",
      steps: [
        "Draw a horizontal band representing your window of tolerance",
        "Above the band: hyperarousal (anxiety, racing thoughts, agitation)",
        "Below the band: hypoarousal (numbness, disconnection, collapse)",
        "Inside the band: your optimal zone (calm, alert, present)",
        "Where are you right now? Mark your current position",
        "If outside the window, what resource might bring you back?",
        "Track your window width over time—it expands with practice"
      ],
      duration: 5,
      instructions: "Dan Siegel's Window of Tolerance helps you recognize when you're dysregulated and choose appropriate strategies",
      source: "The Complex PTSD Workbook"
    },
    {
      id: 'TR-002',
      title: "Temporal Projection",
      steps: [
        "Notice the uncomfortable feeling or negative thought you're experiencing",
        "Ask yourself: How will this feel in 10 seconds?",
        "Then ask: How about in 10 minutes?",
        "Continue: 10 hours from now?",
        "10 days? 10 months? 10 years?",
        "Notice how the intensity naturally diminishes with time perspective",
        "Remind yourself: this feeling is temporary, not permanent"
      ],
      duration: 3,
      instructions: "Uses time perspective to reduce emotional intensity and build distress tolerance",
      source: "Grounding Exercises Handout"
    },
    {
      id: 'TR-003',
      title: "Objective Representation",
      steps: [
        "Identify a situation causing you distress right now",
        "Describe it using detached, factual language only",
        "Replace emotional words with neutral ones",
        "Example: 'They shot me down' becomes 'They disagreed with my proposal'",
        "Example: 'This is terrifying' becomes 'I have a presentation. My heart rate is elevated'",
        "Notice how the emotional charge decreases with neutral language",
        "Practice this when you notice emotionally charged self-talk"
      ],
      duration: 5,
      instructions: "Cognitive defusion technique that reduces emotional reactivity by shifting from emotional to observational language",
      source: "Grounding Exercises Handout"
    },
    {
      id: 'TR-004',
      title: "Pendulation Practice",
      steps: [
        "Find a comfortable seated position",
        "Bring attention to an area of tension, discomfort, or activation in your body",
        "Stay with it briefly—just noticing, not changing it",
        "Now shift your attention to an area that feels neutral or pleasant",
        "Savor the ease in that area for 20-30 seconds",
        "Gently pendulate back to the activation, then back to the resource",
        "Continue this rhythm. Notice the activation naturally decreasing"
      ],
      duration: 10,
      instructions: "Peter Levine's pendulation technique teaches the nervous system that it can move between activation and regulation",
      source: "Somatic Experiencing Handout / Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-004.2',
      title: "RAIN Technique",
      variationOf: 'TR-004',
      steps: [
        "Close your eyes and notice what you're feeling right now",
        "RECOGNIZE: Ask 'What am I noticing inside my body right now?' Observe what comes up",
        "ALLOW: Say to the sensations 'There is space for you to be here.' Don't push anything away",
        "INVESTIGATE: With gentleness—where are sensations strongest? What am I believing? What does this part need?",
        "NURTURE: Invite a compassionate part of yourself to be present. Where do you feel compassion in your body?",
        "Let your awareness settle on any area that feels the opposite of the activation",
        "Rest in this expanded awareness for a few minutes"
      ],
      duration: 10,
      instructions: "Michele McDonald's RAIN technique, popularized by Tara Brach—a structured approach to being with difficult experience without being overwhelmed",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-004.1',
      title: "Titrated Trauma Processing",
      variationOf: 'TR-004',
      steps: [
        "Choose a mildly distressing memory (not the most traumatic one)",
        "Notice where you feel it in your body—describe the sensation",
        "Rate the intensity from 1-10",
        "Now orient to the room: name 3 things you can see",
        "Return to the body sensation briefly. Has the intensity changed?",
        "Pendulate between the sensation and present-moment anchors",
        "Stop when the intensity drops by at least 2 points. Never force deeper"
      ],
      duration: 15,
      instructions: "Working in small, titrated doses prevents retraumatization. Always start with mild distress, not core trauma",
      source: "Somatic Experiencing Handout"
    },
    {
      id: 'TR-005',
      title: "Trace Your Foot Grounding",
      steps: [
        "Place your foot flat on the floor",
        "Imagine you are holding a pen and tracing the entire outline of your foot",
        "Go slowly between each toe, feeling the imaginary pen against your skin",
        "Trace around the heel, along the arch, and back to the toes",
        "Focus on the sensations in exquisite detail",
        "Repeat with the other foot if desired",
        "This pulls attention firmly into the body and present moment"
      ],
      duration: 3,
      instructions: "A discreet grounding technique that can be done anywhere, even during a conversation",
      source: "Grounding Exercises Handout"
    },
    {
      id: 'TR-006',
      title: "Categories Grounding Game",
      steps: [
        "Choose 3 categories from this list: movies, countries, animals, fruits, colors, sports",
        "Name as many items as you can in each category",
        "Spend 1-2 minutes per category",
        "For extra challenge: try naming items alphabetically (apple, banana, carrot...)",
        "This activates the thinking brain, pulling you out of emotional hijack",
        "Use this when you notice yourself spiraling into anxiety or dissociation",
        "Keep going until you feel more grounded and present"
      ],
      duration: 5,
      instructions: "Engages the prefrontal cortex to interrupt amygdala hijack and bring you back to the present",
      source: "Grounding Exercises Handout"
    },
    {
      id: 'TR-007',
      title: "Focus on Numbers",
      steps: [
        "Choose a math task: count backwards from 100 by 7s",
        "Or: add two 3-digit numbers in your head",
        "Or: recite your times tables",
        "Focus all your attention on the numbers",
        "If you lose track, start over—that's fine",
        "Continue for 1-2 minutes",
        "Notice how your emotional intensity has decreased"
      ],
      duration: 2,
      instructions: "Mental math activates the analytical brain and interrupts emotional flooding. A fast, discreet grounding tool",
      source: "Grounding Exercises Handout"
    },
    {
      id: 'TR-008',
      title: "Crown Technique (Head-to-Feet Grounding)",
      steps: [
        "Find a comfortable seat in a chair",
        "Rest one hand on top of your head with a firm but gentle grip",
        "Close your eyes or keep a soft gaze",
        "Notice the sensation of your hand on your head",
        "Now notice your feet on the ground simultaneously",
        "Hold awareness of BOTH—hand on head and feet on ground—at the same time",
        "Stay with this dual awareness for 2-3 minutes, then rest"
      ],
      duration: 3,
      instructions: "Creates a felt sense of the full length of your body, grounding you from crown to feet. Simple but surprisingly powerful",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-009',
      title: "Exploratory Orienting",
      steps: [
        "Sit comfortably and allow your head and neck to move freely",
        "Slowly turn your head to the right, letting your eyes take in whatever they see",
        "Don't look FOR anything—let your gaze be curious and exploratory",
        "Notice colors, textures, light, and objects without judgment",
        "Continue turning slowly to the left, same curious quality",
        "Let your gaze land on anything that catches your attention—stay there briefly",
        "Notice: does your body feel different than when you started?"
      ],
      duration: 5,
      instructions: "Exploratory orienting activates the vagus nerve and social engagement system. It tells your nervous system: I am safe enough to explore",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-010',
      title: "Visualizing a Nurturing Figure",
      steps: [
        "Close your eyes and get comfortable",
        "Imagine a person, animal, or symbol that carries a nurturing quality—real or fictional",
        "Someone or something that makes you feel loved and cared for",
        "Visualize them clearly: their expression, warmth, the feeling of being near them",
        "Notice the somatic sensations that arise—warmth, softening, ease",
        "Find a gesture that expresses this feeling: hand to heart, self-hug, touch your face",
        "Know you can return to this figure anytime you need to feel cared for"
      ],
      duration: 5,
      instructions: "Creates an internal resource for safety and comfort. Especially helpful when real-world support is unavailable",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-011',
      title: "Down-Regulation Pause",
      steps: [
        "When you notice sympathetic activation (racing heart, tension, agitation), pause",
        "Say to yourself: 'I'm experiencing activation right now. This is my nervous system'",
        "Close your eyes and take 3 slow breaths",
        "Bring awareness to your feet on the floor or your back against the chair",
        "If with another person, you can say: 'I need a few moments to pause and breathe'",
        "Stay in the pause until you notice a shift—even a small one",
        "Then re-engage from a more regulated state"
      ],
      duration: 3,
      instructions: "A practical micro-skill for shifting from sympathetic activation to parasympathetic engagement in real-time",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-012',
      title: "Dynamic Stretching with Pendulation",
      steps: [
        "Stand or sit comfortably. Clasp your hands together in front of your chest",
        "Notice the sensations in your body at rest",
        "Extend your clasped hands out in front, backs of hands toward you—stretch just to the edge",
        "Notice the sensations of the stretch. Stay at the edge, don't push further",
        "Release and bring hands back to chest. Notice the contrast—the relief",
        "You just pendulated between tension and release. Repeat 4-5 times",
        "Each cycle teaches your nervous system that activation naturally resolves"
      ],
      duration: 5,
      instructions: "Combines body movement with pendulation practice, teaching the nervous system resilience through physical experience",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-013',
      title: "Trauma Timeline Creation",
      steps: [
        "Get paper and draw a horizontal line representing your life",
        "Mark key events—both difficult and positive—along the timeline",
        "For difficult events, use just 2-3 words as a title (this is a titration technique)",
        "For each event, note: what feels unresolved? What survival response wanted to happen?",
        "Mark positive events too—these are your counter-vortex resources",
        "Notice any patterns or themes across your timeline",
        "Your body needs to know that the past is over. This timeline helps create that clarity"
      ],
      duration: 20,
      instructions: "Creating a timeline contextualizes trauma and helps distinguish past from present. Use titration—only a few words per event",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-014',
      title: "Boundary Awareness Practice",
      steps: [
        "Stand and extend your arms out to your sides, defining your personal space",
        "Notice: this is YOUR space. Everything within arm's reach is yours",
        "Lower your arms but keep awareness of this invisible boundary",
        "Now imagine someone approaching. At what distance do you feel comfortable? Uncomfortable?",
        "Practice saying internally: 'This is my space. I get to choose who enters'",
        "Notice what happens in your body when you claim your space",
        "Practice with a trusted person: ask them to approach slowly while you notice your body's signals"
      ],
      duration: 10,
      instructions: "Trauma often involves boundary violation. Rebuilding a felt sense of personal boundaries is essential for safety",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-019',
      title: "Three Blessings (Gratitude Practice)",
      steps: [
        "Each evening before bed, think about anything good that happened today",
        "Write down three of these good things, no matter how small",
        "For each one, remember exactly how it happened",
        "Most importantly, reflect on WHY each good thing happened",
        "Recognize the giver behind the gift—who made it possible?",
        "Savor each blessing: relish your good fortune or savor the kindness",
        "Do this every night for at least one week. Research shows lasting mood improvements"
      ],
      duration: 10,
      instructions: "Seligman's Three Blessings exercise is one of the most researched positive psychology interventions. It rewires the brain's negativity bias",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'TR-020',
      title: "Taking In the Good",
      steps: [
        "Relax and gently close your eyes",
        "Bring to mind any positive emotion you experienced today, however small",
        "Once chosen, begin to intensify the feeling and sensations",
        "Try to remember what made these emotions feel strong",
        "Let the positive experience fill your body—really absorb it for 20-30 seconds",
        "This active savoring turns passing experiences into lasting neural changes",
        "Practice daily: each time you notice something good, stop and take it in"
      ],
      duration: 5,
      instructions: "Rick Hanson's practice of 'taking in the good' counteracts the negativity bias by deliberately installing positive experiences in memory",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'TR-021',
      title: "Gratitude Letter",
      steps: [
        "Think of someone who has made a meaningful difference in your life",
        "Write them a letter of gratitude—be specific about what they did and how it affected you",
        "Describe how their kindness, wisdom, or support changed your path",
        "Express what they mean to you today",
        "If possible, read the letter aloud to them in person",
        "If not possible, read it aloud to yourself or a trusted friend",
        "Notice the emotions that arise as you express gratitude"
      ],
      duration: 20,
      instructions: "One of the most powerful positive psychology exercises. Writing and delivering a gratitude letter produces lasting increases in happiness",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'TR-022',
      title: "Inner Child Dialogue",
      steps: [
        "Get pen and paper. Write questions with your dominant hand on the left",
        "Answer with your non-dominant hand on the right—this accesses the child part",
        "Start with simple questions: 'How are you feeling?' 'What do you need?'",
        "Wait patiently for answers to surface. Don't force anything",
        "The child part may be angry, scared, or silent at first—that's okay",
        "Respond with nurturing, kind words. Build trust over time",
        "Practice regularly—this is a relationship, not a one-time exercise"
      ],
      duration: 15,
      instructions: "Writing with your non-dominant hand accesses the right brain and younger parts. This exercise builds an internal nurturing relationship",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'TR-023',
      title: "Containment Imagery",
      steps: [
        "Close your eyes and imagine a strong, secure container with a lock",
        "It could be a safe, a treasure chest, a vault—whatever feels secure to you",
        "Imagine placing any distressing thoughts, feelings, or images into the container",
        "See yourself closing the lid firmly and locking it",
        "The container is fireproof, waterproof, and indestructible",
        "You hold the only key. You can open it when you choose, with support",
        "For now, let the container hold what's too much, so you can attend to the present"
      ],
      duration: 5,
      instructions: "Not suppression—strategic containment. This allows you to function in daily life while keeping traumatic material contained until you're ready to process it safely",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'TR-024',
      title: "Roots Meditation (Earth Breathing)",
      steps: [
        "Lie on your back with spine fully supported, eyes closed",
        "Bring attention to the back of your body where it meets the floor",
        "Imagine roots growing from the back of your body down into the earth",
        "With each exhale, the roots grow deeper—through soil, rock, water",
        "With each inhale, draw up nourishment and stability from the earth",
        "Feel the earth's solidity supporting every part of you",
        "Stay for 5-10 minutes, feeling increasingly rooted and supported"
      ],
      duration: 10,
      instructions: "Adapted from Reginald Ray's Earth Breathing. Combines grounding with lying-down meditation for deep somatic connection to support",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'TR-025',
      title: "Me and My Shadow Exercise",
      steps: [
        "Bring to mind a person you strongly dislike or even hate",
        "Write a thorough description of their traits and qualities you find most objectionable",
        "Be as detailed and honest as possible—what specifically bothers you?",
        "Now look at this list: which of these traits might exist within you, even slightly?",
        "This is your 'shadow'—the rejected parts of yourself projected onto others",
        "Can you acknowledge these parts with curiosity instead of judgment?",
        "Integrating your shadow reduces reactivity and increases self-awareness"
      ],
      duration: 15,
      instructions: "Jung's shadow work: what we most dislike in others often reflects disowned parts of ourselves. Acknowledgment is the first step to integration",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'TR-026',
      title: "Mindfulness Eating Exercise",
      steps: [
        "Take a single raisin, grape, or small piece of chocolate",
        "Hold it in your palm. Look at it as if you've never seen one before",
        "Notice the color, texture, shape, weight, and any smells",
        "Slowly bring it to your lips. Notice the anticipation",
        "Place it on your tongue without chewing. Feel its texture, temperature, weight",
        "Begin to slowly chew, noticing each burst of flavor, texture changes, the urge to swallow",
        "Swallow mindfully. Notice the taste that remains, any lingering sensations"
      ],
      duration: 5,
      instructions: "Kabat-Zinn's classic raisin exercise. A powerful demonstration that most of the time, we eat on autopilot—and live on autopilot too",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'TR-027',
      title: "EFT Tapping",
      steps: [
        "Identify the issue. Rate the intensity of distress from 0-10",
        "Create a setup statement: 'Even though I have [this problem], I deeply and completely accept myself'",
        "Repeat this 3 times while tapping the karate chop point (side of hand)",
        "Tap 5-7 times on each point while repeating a reminder phrase: eyebrow, side of eye, under eye, under nose, chin, collarbone, under arm",
        "Take a deep breath",
        "Rate the intensity again. Continue rounds until it drops significantly",
        "Add positive affirmations in later rounds as the intensity decreases"
      ],
      duration: 10,
      instructions: "Emotional Freedom Technique combines acupressure tapping with cognitive reprocessing. Research supports its effectiveness for anxiety and PTSD",
      source: "101 Trauma-Informed Interventions (Linda Curran)"
    },
    {
      id: 'TR-015',
      title: "Safely Saying No",
      steps: [
        "Find a private, comfortable space",
        "Say 'no' out loud several times. Notice what happens in your body",
        "Does your voice strengthen? Do you feel tension? Relief? Power?",
        "Think of a situation where you wished you'd said no but couldn't",
        "What stopped you? Fear of conflict? People-pleasing? Freeze response?",
        "Now practice saying no to that situation out loud, with full body engagement",
        "Notice your breath, tone, posture. Let your body practice what your mind knows"
      ],
      duration: 10,
      instructions: "Many trauma survivors lost access to 'no.' Practicing it somatically rebuilds the boundary-setting capacity in the body",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-016',
      title: "Bringing Past Self to Present",
      steps: [
        "Sit comfortably and ground yourself in the present moment—feet on floor, chair supporting you",
        "Think of a recent moment when you felt resourced, capable, and wise. Feel it in your body",
        "Now lean forward slowly, arms opening, and reach into the past",
        "Grab the younger version of you who was hurt, scared, or alone",
        "Close your arms and pull that past self into the present, into your body",
        "Tell them: 'You are safe now. I've got you. The past is over'",
        "Look around the room. Feel your feet. Orient to the present with your past self held close"
      ],
      duration: 10,
      instructions: "A powerful somatic practice that helps your nervous system know the past is over and that you are safe in the present",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-017',
      title: "Protector Figure Visualization",
      steps: [
        "Close your eyes and get comfortable",
        "Imagine a powerful protective figure—a person, animal, or mythical being",
        "This figure is fearlessly devoted to your safety. Nothing can get past them",
        "Visualize them clearly: their strength, their presence, their fierce love",
        "Notice what happens in your body—do you feel safer? Stronger?",
        "Find a gesture that expresses protection: make claws, open your jaw, stand tall",
        "Keep this protector available in your mind. Call on them when you feel threatened"
      ],
      duration: 5,
      instructions: "While a nurturing figure provides love, a protector provides safety. Both are essential internal resources for trauma recovery",
      source: "Somatic Therapy for Healing Trauma"
    },
    {
      id: 'TR-018',
      title: "Trigger Mapping and Resource Plan",
      steps: [
        "Identify a trigger you want to understand better",
        "What sensations do you typically feel when triggered? (chest tightening, neck prickling, etc.)",
        "What emotions arise? Name the primary feeling and any secondary feelings",
        "What thoughts or beliefs get activated? (I'm not safe, I'm not enough, etc.)",
        "Now list your resources: breathing exercises, grounding techniques, safe people to call",
        "Create an if-then plan: 'When I notice [trigger sensation], I will [resource]'",
        "Keep this plan accessible—phone notes, wallet card, or posted where you'll see it"
      ],
      duration: 15,
      instructions: "Mapping triggers and pairing them with specific resources creates a personal emergency plan for dysregulation",
      source: "Somatic Therapy for Healing Trauma"
    },
  ],
};

/**
 * EXERCISE CATEGORIES
 * Extended from original with new categories
 */
import { icons } from '../lib/uiIcons';

export const exerciseCategories = [
  {
    id: 'all',
    name: 'All Exercises',
    icon: 'apps',
    iconImage: icons.tools,
    color: '#8b5cf6',
    description: 'Browse all available exercises'
  },
  {
    id: 'breathing',
    name: 'Breathing',
    icon: 'air',
    iconImage: icons.breath,
    color: '#3b82f6',
    description: 'Regulate your nervous system through breath'
  },
  {
    id: 'grounding',
    name: 'Grounding',
    icon: 'landscape',
    iconImage: icons.grounding,
    color: '#10b981',
    description: 'Connect to the present moment and your body'
  },
  {
    id: 'somatic',
    name: 'Somatic',
    icon: 'accessibility',
    iconImage: icons.bodyScanAlt,
    color: '#f59e0b',
    description: 'Body-based awareness and release practices'
  },
  {
    id: 'polyvagal',
    name: 'Nervous System',
    icon: 'favorite',
    iconImage: icons.nsMap,
    color: '#ef4444',
    description: 'Map, track, and shape your autonomic state'
  },
  {
    id: 'partsWork',
    name: 'Parts Work (IFS)',
    icon: 'groups',
    iconImage: icons.roles,
    color: '#ec4899',
    description: 'Internal Family Systems dialogue with your parts'
  },
  {
    id: 'selfCompassion',
    name: 'Self-Compassion',
    icon: 'self-improvement',
    iconImage: icons.compassion,
    color: '#14b8a6',
    description: 'Practices for kindness toward yourself'
  },
  {
    id: 'meditation',
    name: 'Meditation',
    icon: 'spa',
    iconImage: icons.meditate,
    color: '#6366f1',
    description: 'Formal contemplative and mindfulness practices'
  },
  {
    id: 'jungian',
    name: 'Depth Psychology',
    icon: 'psychology',
    iconImage: icons.activeImagination,
    color: '#f97316',
    description: 'Visualization tools for shadow work, archetypes, and inner transformation'
  },
  {
    id: 'cbt',
    name: 'Cognitive Work',
    icon: 'lightbulb',
    iconImage: icons.coreBeliefs,
    color: '#eab308',
    description: 'Restructure unhelpful thoughts and core beliefs'
  },
  {
    id: 'habits',
    name: 'Habits',
    icon: 'repeat',
    iconImage: icons.trailProgress,
    color: '#84cc16',
    description: 'Build lasting behavioral change with small steps'
  },
  {
    id: 'psychedelicIntegration',
    name: 'Integration',
    icon: 'auto-awesome',
    iconImage: icons.integration,
    color: '#a855f7',
    description: 'Practices specifically for psychedelic integration'
  },
  {
    id: 'yoga',
    name: 'Movement',
    icon: 'fitness-center',
    iconImage: icons.movement,
    color: '#06b6d4',
    description: 'Trauma-informed yoga and movement practices'
  },
  {
    id: 'stoic',
    name: 'Stoic Philosophy',
    icon: 'school',
    iconImage: icons.selfReflect,
    color: '#78716c',
    description: 'Ancient wisdom practices for resilience and perspective'
  },
  {
    id: 'trauma',
    name: 'Trauma Recovery',
    icon: 'healing',
    iconImage: icons.repairedHeart,
    color: '#be185d',
    description: 'Evidence-based practices for trauma processing and recovery'
  }
];

/**
 * Helper function to get all exercises as a flat array
 */
export const getAllExercises = () => {
  const allExercises = [];
  Object.entries(exercises).forEach(([category, exerciseList]) => {
    exerciseList.forEach(exercise => {
      allExercises.push({
        ...exercise,
        category: category
      });
    });
  });
  return allExercises;
};

/**
 * Helper function to get exercises by category
 */
export const getExercisesByCategory = (categoryId) => {
  if (categoryId === 'all') {
    return getAllExercises();
  }
  return (exercises[categoryId] || []).map(ex => ({
    ...ex,
    category: categoryId
  }));
};

/**
 * Helper function to get exercise by ID
 */
export const getExerciseById = (id) => {
  for (const [category, exerciseList] of Object.entries(exercises)) {
    const found = exerciseList.find(ex => ex.id === id);
    if (found) return { ...found, category };
  }
  return null;
};

/**
 * Helper function to get variations of an exercise
 */
export const getVariations = (exerciseId) => {
  const baseId = exerciseId.split('.')[0];
  return getAllExercises().filter(ex =>
    ex.id === baseId || (ex.variationOf === baseId) || ex.id.startsWith(baseId + '.')
  );
};

/**
 * Get exercise count per category
 */
export const getExerciseCounts = () => {
  const counts = {};
  Object.entries(exercises).forEach(([category, list]) => {
    counts[category] = list.length;
  });
  counts.all = getAllExercises().length;
  return counts;
};
