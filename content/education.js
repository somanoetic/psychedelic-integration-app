/**
 * EDUCATION CONTENT
 *
 * This file contains all educational topics and their content.
 * Edit this file to add, remove, or modify educational materials.
 *
 * Each topic has:
 * - id: Unique identifier
 * - title: Display name
 * - description: Brief overview
 * - emoji: Icon to display
 * - estimatedTime: How long to read/complete
 * - content: Array of sections with titles and text
 * - keyTakeaways: Main points to remember (optional)
 * - furtherReading: Links or resources (optional)
 */

export const educationTopics = [
  {
    id: 'nervous_system',
    title: 'Understanding Your Nervous System',
    description: 'Learn about the three states and how they affect your experience',
    emoji: '🧠',
    estimatedTime: '5 minutes',
    content: [
      {
        title: 'Introduction to Polyvagal Theory',
        text: `Your nervous system is constantly scanning for safety and danger, operating in three main states. Understanding these states helps you work with your body's natural responses rather than against them.`
      },
      {
        title: '💚 Ventral Vagal: Safe & Social',
        text: `This is your optimal state for connection, learning, and integration. You feel:
• Calm and present
• Open to connection
• Able to think clearly
• Curious and engaged
• Safe in your body

In this state, you can process difficult emotions and integrate insights from psychedelic experiences.`
      },
      {
        title: '⚡ Sympathetic: Fight or Flight',
        text: `This is your mobilization state, activated when you perceive threat. You might feel:
• Anxious or agitated
• Racing thoughts or heart
• Tense muscles
• Restless energy
• Difficulty focusing

This isn't "bad" - it's protective! But chronic activation can be exhausting. Grounding and breathing exercises help shift back to ventral.`
      },
      {
        title: '🛡️ Dorsal Vagal: Shutdown & Freeze',
        text: `This is your immobilization state, when threat feels overwhelming. You might feel:
• Numb or disconnected
• Foggy thinking
• Low energy or fatigue
• Emotionally flat
• Wanting to withdraw

This is also protective - your body's way of conserving energy. Gentle movement and connection practices help shift out of shutdown.`
      },
      {
        title: 'Working With Your States',
        text: `Integration happens best in ventral vagal. If you notice you're in sympathetic or dorsal:
1. Name it: "I'm in fight/flight" or "I'm in shutdown"
2. Be compassionate: These states are protective, not failures
3. Use practices: Breathing for sympathetic, gentle movement for dorsal
4. Return when ready: Come back to integration work when you feel safer`
      }
    ],
    keyTakeaways: [
      'Your nervous system has three states: safe/social, fight/flight, and shutdown',
      'Each state is protective and adaptive, not good or bad',
      'Integration works best when you feel safe (ventral vagal)',
      'You can shift states using breath, movement, and connection'
    ]
  },

  {
    id: 'integration_basics',
    title: 'Integration Basics',
    description: 'What is integration and why it matters for psychedelic experiences',
    emoji: '🌱',
    estimatedTime: '7 minutes',
    content: [
      {
        title: 'What Is Integration?',
        text: `Integration is the process of weaving insights and experiences from psychedelic journeys into your everyday life. It's not just about remembering what happened - it's about letting those experiences change you in meaningful, sustainable ways.`
      },
      {
        title: 'Why Integration Matters',
        text: `Without integration, psychedelic experiences can be:
• Overwhelming and confusing
• Quickly forgotten or dismissed
• Disconnected from daily life
• Missed opportunities for growth

With integration, experiences become:
• Sources of lasting wisdom
• Catalysts for real change
• Connections to deeper self-knowledge
• Foundations for healing`
      },
      {
        title: 'The Integration Window',
        text: `Research suggests the most powerful integration happens in the first 6-8 weeks after an experience. Your brain is more plastic, patterns are more changeable, and insights are still fresh.

But integration is also a lifelong process - you may return to the same experience years later and find new meaning.`
      },
      {
        title: 'Key Integration Practices',
        text: `Effective integration includes:

1. **Documentation**: Write, draw, or record your experience
2. **Reflection**: Make time to process and explore meanings
3. **Embodiment**: Bring insights into your body through movement and ritual
4. **Application**: Take concrete actions based on what you learned
5. **Community**: Share with trusted friends, therapists, or integration circles
6. **Patience**: Allow integration to unfold at its own pace`
      },
      {
        title: 'Common Integration Challenges',
        text: `You might experience:
• Difficulty putting experiences into words
• Feeling misunderstood by others
• Insights fading over time
• Resistance to change
• Old patterns re-emerging

All of this is normal! Integration is a practice, not a one-time event.`
      }
    ],
    keyTakeaways: [
      'Integration turns experiences into lasting wisdom and change',
      'The first 6-8 weeks are especially important for integration work',
      'Multiple practices support integration: documentation, reflection, embodiment, application',
      'Integration challenges are normal and part of the process'
    ]
  },

  {
    id: 'johnson_framework',
    title: "Johnson's 4-Step Process",
    description: 'A proven framework for processing and integrating experiences',
    emoji: '🗺️',
    estimatedTime: '10 minutes',
    content: [
      {
        title: 'Overview',
        text: `Robert Johnson's framework, originally developed for dreamwork, provides a systematic way to extract meaning from symbolic experiences. The four steps are:

1. Gathering Elements
2. Connecting to Inner Dynamics
3. Interpretation
4. Rituals`
      },
      {
        title: 'Phase 1: Gathering Elements',
        text: `The goal is comprehensive data collection - capture EVERYTHING from your experience:

• Visuals (colors, shapes, beings, environments)
• Sounds (music, voices, silence)
• Emotions (what you felt)
• Sensations (body feelings, energy)
• Insights (realizations, knowings)
• Symbols (anything that stood out)

Write these down physically - the act of writing makes connections real and prevents forgetting.`
      },
      {
        title: 'Phase 2: Connecting to Inner Dynamics',
        text: `For each element, ask: "What part of me is that?"

Connect symbols to specific inner realities:
• Emotions and feelings
• Inner conflicts
• Parts of your personality
• Belief systems
• Behavior patterns

Example: A "golden light" might represent hope, your wise self, or divine connection. Find where YOU experience that quality in your life with specific examples.`
      },
      {
        title: 'Phase 3: Interpretation',
        text: `Synthesize everything into one unified meaning:

• What is the central message?
• What is the experience advising you to do?
• What's the single most important insight?

Validation principles:
1. Choose interpretations that teach something NEW
2. Avoid ego inflation or self-congratulation
3. Keep responsibility with yourself (not blaming others)
4. Be willing to live with ambiguity if needed

CRITICAL: Write your interpretation out. This moves it from fantasy to concrete reality.`
      },
      {
        title: 'Phase 4: Rituals',
        text: `Do something PHYSICAL to honor the experience:

Rituals can be:
• Practical acts (change a behavior, start a practice)
• Symbolic ceremonies (bury something, offer flowers to water)

Ritual principles:
• Keep them SMALL and subtle (not grand)
• Make them PHYSICAL (use your body)
• Keep them SOLITARY (private, just you)
• Keep them SILENT (don't talk about it)

Example: If your experience revealed a need for simplicity, spend one evening organizing one drawer with full presence and ceremony.`
      }
    ],
    keyTakeaways: [
      'Gather ALL elements comprehensively before moving to interpretation',
      'Connect each element to specific inner dynamics with real-life examples',
      'Write out your interpretation - this makes it concrete',
      'Small, physical rituals have the most power for integration'
    ]
  },

  {
    id: 'ifs_chat',
    title: 'IFS Parts Work Session',
    description: 'Interactive guided session to get to know one of your parts',
    emoji: '💬',
    estimatedTime: '15-20 minutes',
    isInteractive: true,
    content: [
      {
        title: 'What is an IFS Session?',
        text: `This is an interactive guided session using the Six F's framework from Internal Family Systems therapy.

You'll work with an AI guide to:
• **Find** a part that wants your attention
• **Focus** on where and how it shows up
• **Flesh Out** its role and story
• **Feel Toward** it from your Self
• **BeFriend** it with curiosity
• **Understand its Fears** and concerns

This builds relationship with your parts, which is the foundation for healing and integration.`
      },
      {
        title: 'Who is this for?',
        text: `This session is helpful if you:
• Notice inner conflicts or self-criticism
• Want to understand reactive patterns
• Feel "stuck" in certain behaviors
• Are working with psychedelic integration
• Want to develop self-compassion
• Are curious about your inner system

No prior IFS experience needed - the guide will walk you through each step.`
      }
    ],
    keyTakeaways: [
      'IFS work is about relationship, not fixing or changing parts',
      'All parts have positive intentions, even when methods are problematic',
      'Your Self has the wisdom and compassion to heal',
      'This is a beginning - parts work is an ongoing practice'
    ]
  },

  {
    id: 'parts_work',
    title: 'Internal Family Systems (IFS)',
    description: 'Understanding different parts of yourself and how they protect you',
    emoji: '👥',
    estimatedTime: '8 minutes',
    content: [
      {
        title: 'Introduction to IFS',
        text: `Internal Family Systems (IFS) views the mind as made up of multiple sub-personalities or "parts." All parts have positive intentions, even when their methods are problematic.

Developed by Richard Schwartz, IFS helps you understand and heal inner conflicts by working compassionately with all parts of yourself.`
      },
      {
        title: 'The Core Self',
        text: `At your center is the Self - your core consciousness, characterized by the "8 C's":

• Calmness
• Clarity
• Compassion
• Confidence
• Courage
• Creativity
• Curiosity
• Connectedness

The Self can't be damaged, only obscured by protective parts. Integration work helps parts trust the Self to lead.`
      },
      {
        title: 'Exiles: The Wounded Parts',
        text: `Exiles are young parts that carry pain, trauma, shame, or fear. They're usually from childhood. Other parts work hard to keep exiles hidden because their pain feels overwhelming.

Common exiles:
• The abandoned child
• The shamed one
• The terrified part
• The one who feels unlovable

Psychedelic experiences often bring exiles to awareness for healing.`
      },
      {
        title: 'Managers: The Controllers',
        text: `Managers are parts that try to prevent exile pain from surfacing. They run your daily life to keep you safe.

Common managers:
• The perfectionist
• The inner critic
• The planner/controller
• The intellectual/analyzer
• The caretaker (focusing on others)

Managers are exhausted from their constant vigilance. They need appreciation and permission to rest.`
      },
      {
        title: 'Firefighters: Emergency Responders',
        text: `Firefighters activate when exiles break through despite managers' efforts. They use intense, often impulsive methods to distract from pain.

Common firefighters:
• Substance use
• Binge eating or restricting
• Self-harm
• Rage
• Dissociation

Firefighters deserve appreciation too - they step in when pain feels unbearable.`
      },
      {
        title: 'Working With Parts',
        text: `The IFS process:

1. **Notice** a part (sensation, emotion, thought pattern)
2. **Get curious** about it (not critical)
3. **Ask permission** from protective parts to connect
4. **Listen** to what this part needs
5. **Appreciate** its positive intention
6. **Unburden** exiles when they're ready
7. **Update** protectors on how you can help

The goal isn't eliminating parts, but creating harmony where the Self leads compassionately.`
      }
    ],
    keyTakeaways: [
      'Your psyche is made up of multiple parts, all with positive intentions',
      'Exiles carry pain, managers prevent it, firefighters distract from it',
      'All parts deserve curiosity and appreciation, not criticism',
      'The Self can heal and lead when parts trust it'
    ]
  },

  {
    id: 'regulation_practices',
    title: 'Nervous System Regulation',
    description: 'Practical tools for calming activation and reconnecting when shutdown',
    emoji: '🌊',
    estimatedTime: '6 minutes',
    content: [
      {
        title: 'Why Regulation Matters',
        text: `You can't integrate insights when your nervous system is dysregulated. Fight/flight makes it hard to think clearly. Shutdown makes it hard to feel anything.

Learning to regulate helps you:
• Return to a window of tolerance
• Process difficult emotions safely
• Stay present during integration work
• Build resilience over time`
      },
      {
        title: 'For Sympathetic Activation (Fight/Flight)',
        text: `When you're anxious, agitated, or overwhelmed:

**Breathing practices:**
• 4-7-8 breath (inhale 4, hold 7, exhale 8)
• Box breathing (4-4-4-4)
• Extended exhale (breathe out longer than in)

**Grounding practices:**
• 5-4-3-2-1 sensory awareness
• Feel your feet on the floor
• Cold water on face or wrists
• Progressive muscle relaxation

**Movement:**
• Shake or dance
• Go for a walk
• Stretch or yoga`
      },
      {
        title: 'For Dorsal Shutdown (Freeze/Collapse)',
        text: `When you're numb, disconnected, or low energy:

**Gentle activation:**
• Stand up and stretch
• Splash face with cool water
• Hum or sing
• Notice 3 things you can see

**Connection practices:**
• Text a friend
• Pet an animal
• Look at photos of loved ones
• Listen to uplifting music

**Small movements:**
• Wiggle fingers and toes
• Rock gently side to side
• Take a short walk
• Do simple tasks (fold laundry, wash dishes mindfully)`
      },
      {
        title: 'Building Window of Tolerance',
        text: `Your "window of tolerance" is the zone where you can process emotions without getting overwhelmed or shutting down.

You can gradually expand this window through:
• Regular regulation practices
• Therapy (especially somatic therapy)
• Mindfulness meditation
• Building safe relationships
• Healing trauma

Notice what makes your window smaller (stress, triggers) and larger (sleep, connection, practices).`
      },
      {
        title: 'When to Seek Additional Support',
        text: `Consider professional help if:
• You're frequently dysregulated for days at a time
• Self-regulation practices aren't helping
• You're experiencing trauma symptoms
• Integration is bringing up overwhelming material
• You're struggling with daily functioning

A trauma-informed therapist can provide additional tools and support for regulation.`
      }
    ],
    keyTakeaways: [
      'Regulation creates safety for integration work',
      'Different states need different approaches: breathe for activation, move for shutdown',
      'Building your window of tolerance takes time and practice',
      'Professional support is valuable when self-regulation isn\'t enough'
    ]
  },

  {
    id: 'polyvagal_mapping',
    title: 'Map Your Nervous System',
    description: 'Interactive exercise to identify your three nervous system states',
    emoji: '🗺️',
    estimatedTime: '10-15 minutes',
    isInteractive: true,
    content: [
      {
        title: 'What is Polyvagal Mapping?',
        text: `This interactive exercise helps you create a personal map of your three nervous system states. By identifying what each state looks and feels like FOR YOU, you gain powerful self-awareness for integration work.

Understanding your states helps you:
• Recognize when you're dysregulated
• Choose appropriate regulation practices
• Have more compassion for your responses
• Work more effectively with your nervous system`
      },
      {
        title: 'The Three States',
        text: `💚 **Ventral Vagal (Safe & Social)**
Your optimal state for connection and integration. You feel calm, present, and engaged.

⚡ **Sympathetic (Fight/Flight)**
Your mobilization state when perceiving threat. You feel activated, anxious, or energized.

🛡️ **Dorsal Vagal (Shutdown)**
Your immobilization state when threat feels overwhelming. You feel numb, disconnected, or withdrawn.`
      }
    ],
    keyTakeaways: [
      'Each person\'s nervous system states have unique triggers and expressions',
      'Mapping your states builds self-awareness and compassion',
      'Knowing your state helps you choose the right regulation practices',
      'This is a foundational tool for integration work'
    ]
  },

  {
    id: 'triggers_glimmers',
    title: 'Triggers & Glimmers',
    description: 'Map what dysregulates you and what brings you back to safety',
    emoji: '⚡✨',
    estimatedTime: '10-12 minutes',
    isInteractive: true,
    content: [
      {
        title: 'What are Triggers and Glimmers?',
        text: `**Triggers** are cues that move your nervous system into dysregulation - either into fight/flight activation or shutdown collapse. They can be external (sounds, situations) or internal (thoughts, sensations).

**Glimmers** are the opposite - micro-moments that signal safety to your nervous system. A warm cup of tea, sunlight on your face, your pet's greeting, a friend's smile.

This mapping helps you understand what moves you out of regulation AND what brings you back.`
      },
      {
        title: 'The Power of Glimmers',
        text: `While we often focus on avoiding triggers, cultivating glimmers is equally important. The more you notice and intentionally create glimmers, the more your nervous system learns to find safety.

Glimmers build resilience and expand your window of tolerance over time.`
      }
    ],
    keyTakeaways: [
      'Triggers are not your fault - they\'re learned nervous system responses',
      'Glimmers are micro-moments that signal safety',
      'You can intentionally cultivate more glimmers in your daily life',
      'Both awareness of triggers and cultivation of glimmers support regulation'
    ]
  },

  {
    id: 'regulating_resources',
    title: 'Regulating Resources',
    description: 'Identify what helps you regulate - alone and with others',
    emoji: '🛠️',
    estimatedTime: '8-10 minutes',
    isInteractive: true,
    content: [
      {
        title: 'What are Regulating Resources?',
        text: `Regulating resources are practices and connections that help your nervous system return to safety. This exercise helps you identify two types:

🧘 **Individual Resources** - Things you do alone (breathing, movement, nature, creative expression)

🤝 **Interactive Resources** - Ways you co-regulate with others (connection, support, community)

Both are essential for resilience!`
      },
      {
        title: 'The Importance of Balance',
        text: `While individual resources give you autonomy and self-sufficiency, we're fundamentally wired for co-regulation. Healthy nervous system regulation includes both.

Too much reliance on individual resources can lead to isolation. Too much reliance on others can lead to burnout or lack of self-trust. The goal is flexible access to both.`
      }
    ],
    keyTakeaways: [
      'You need both individual and interactive regulating resources',
      'Co-regulation (connection with others) is a biological need',
      'Building a diverse resource toolkit increases resilience',
      'Different states may need different types of resources'
    ]
  },

  {
    id: 'symbol_meaning',
    title: 'Symbols & Archetypes',
    description: 'Common symbols and their meanings in psychedelic experiences',
    emoji: '🔮',
    estimatedTime: '12 minutes',
    content: [
      {
        title: 'Understanding Symbolic Language',
        text: `Psychedelic experiences often speak in symbols - the language of the unconscious. Symbols are multilayered and personal, but certain patterns appear across cultures and individuals.

Important: YOUR associations matter most. These interpretations are starting points, not definitive meanings.`
      },
      {
        title: 'Light & Darkness',
        text: `**Light (golden, white, radiant):**
• Consciousness, awareness
• Divine presence
• Healing energy
• Wisdom, enlightenment
• The Self (in Jungian terms)

**Darkness:**
• The unconscious
• The unknown
• Mystery and potential
• The shadow (hidden aspects)
• Void or emptiness (not negative - the source of creation)`
      },
      {
        title: 'Water',
        text: `**Ocean/Deep Water:**
• The unconscious mind
• Emotions and feelings
• The mother, the feminine
• Vast potential

**Rivers/Flowing Water:**
• Life force, vitality
• The flow of time
• Emotions in motion
• Cleansing, purification

**Storms:**
• Emotional turmoil
• Transformation
• Cleansing change`
      },
      {
        title: 'Animals',
        text: `Animals often represent instinctual energies or qualities:

**Snake:**
• Transformation, healing
• Wisdom, life force (kundalini)
• Death and rebirth

**Bird:**
• Spirit, transcendence
• Freedom, perspective
• Messages from beyond

**Wolf:**
• Instinct, wildness
• Social connection
• Teacher, guide

**Bear:**
• Strength, protection
• Introspection (hibernation)
• The mother archetype

YOUR association is most important - if you fear snakes, that changes the meaning!`
      },
      {
        title: 'Archetypal Figures',
        text: `**Mother/Grandmother:**
• Nurturing, care
• Wisdom
• The feminine divine
• Home, belonging

**Father/Grandfather:**
• Authority, structure
• Protection
• The masculine divine
• Discipline, order

**Child:**
• Innocence, wonder
• Your inner child
• New beginnings
• Vulnerability

**Wise Old Person:**
• Inner wisdom
• The Self
• Guidance
• Integration of experience

**Trickster:**
• Chaos, disruption
• Humor, play
• Breaking rigid patterns
• Shadow integration`
      },
      {
        title: 'Sacred Geometry & Patterns',
        text: `**Spirals:**
• Growth, evolution
• The journey inward
• Cycles of return

**Mandalas/Circles:**
• Wholeness, completion
• The Self
• Sacred space
• Integration

**Fractals:**
• Infinite complexity
• Connection of all things
• Patterns repeating at every scale

**Triangle:**
• Trinity, balance
• Ascending toward higher consciousness
• Stability`
      },
      {
        title: 'Working With Symbols',
        text: `To understand YOUR symbols:

1. **Notice your immediate feeling** about the symbol
2. **Free associate** - what comes to mind?
3. **Find it in your life** - where do you encounter this quality?
4. **Ask what it wants** - if it could speak, what would it say?
5. **Honor it** - through art, writing, or ritual

Remember: Symbols are bridges between unconscious wisdom and conscious understanding. Be curious, not certain.`
      }
    ],
    keyTakeaways: [
      'Symbols are the language of the unconscious mind',
      'Universal patterns exist, but YOUR associations matter most',
      'Same symbol can mean different things in different contexts',
      'Work with symbols through feeling, association, and creative expression'
    ]
  },

  // ===== NEW MODULES (sourced from knowledge base PDFs) =====

  {
    id: 'somatic_awareness',
    title: 'Somatic Awareness & the Body',
    description: 'Learn to read your body\'s signals and use body-based tools for healing',
    emoji: '🫁',
    estimatedTime: '10 minutes',
    content: [
      {
        title: 'Why the Body Matters',
        text: `Trauma and intense experiences live in the body, not just the mind. Sensorimotor Psychotherapy recognizes that physical patterns — posture, tension, breathing, movement — both reflect and sustain unresolved experiences.

Your body is constantly sending signals: gut feelings, tension patterns, changes in breathing, energy shifts. Learning to read these signals gives you a direct line to your inner world.`
      },
      {
        title: 'Body Awareness Basics',
        text: `Start by simply noticing without trying to change anything:

• **Scan from head to feet** — Where do you feel tension? Openness? Numbness?
• **Notice your breathing** — Is it shallow or deep? Fast or slow? Where does it move?
• **Feel your posture** — Are you collapsed? Braced? Open?
• **Track sensations** — Tingling, warmth, pressure, tightness, spaciousness

This isn't about fixing — it's about listening. Your body has wisdom that your thinking mind may not access directly.`
      },
      {
        title: 'The Window of Tolerance',
        text: `Your "window of tolerance" is the zone where you can experience sensations and emotions without becoming overwhelmed (hyperarousal) or shutting down (hypoarousal).

**Above the window (hyperarousal):**
• Racing heart, rapid breathing
• Muscle tension, clenched jaw
• Feeling flooded or panicked

**Below the window (hypoarousal):**
• Numbness, heaviness
• Foggy thinking, disconnection
• Feeling flat or collapsed

**Inside the window:**
• You can feel without being overwhelmed
• Sensations flow and change
• You stay present and connected

Integration work is most effective when you stay within or near the edges of your window.`
      },
      {
        title: 'Somatic Resources',
        text: `These body-based practices can help you regulate:

**Grounding:** Feel your feet on the floor, press your back against a chair, hold something with texture. These remind your body it's here and safe.

**Orienting:** Slowly look around the room, noticing colors, shapes, and objects. This activates your social engagement system and signals safety.

**Containment:** Imagine a strong container (box, vault, cave) where you can place overwhelming material until you're ready. Place your hands on your chest or belly as a physical anchor.

**Pendulation:** Gently shift attention between an area of discomfort and an area of comfort or neutrality. This teaches your nervous system that sensations change — nothing stays forever.`
      },
      {
        title: 'Embodied Integration',
        text: `After a psychedelic experience, your body may carry material that words can't capture:

1. **Move it** — Dance, shake, stretch, walk. Let your body process what it needs to
2. **Sound it** — Humming, sighing, toning can release held energy
3. **Touch it** — Self-massage, warm baths, weighted blankets
4. **Express it** — Draw what you feel in your body, sculpt with clay
5. **Rest it** — Sometimes integration means simply being still and letting the body settle

The body processes at its own pace. Trust the timing.`
      }
    ],
    keyTakeaways: [
      'Trauma and insight live in the body, not just the mind',
      'Body awareness means listening without trying to fix',
      'The window of tolerance is your zone for safe processing',
      'Somatic resources like grounding and pendulation help regulate',
      'Let the body process at its own pace through movement, sound, and rest'
    ]
  },

  {
    id: 'brain_and_healing',
    title: 'Your Brain on Healing',
    description: 'How neuroscience explains why integration works and how your brain changes',
    emoji: '🧬',
    estimatedTime: '10 minutes',
    content: [
      {
        title: 'Neuroplasticity: Your Brain Can Change',
        text: `Your brain is not fixed — it rewires itself throughout life. This is neuroplasticity, and it's the biological basis for integration.

Every time you practice a new pattern — regulating your breathing instead of spiraling, sitting with an emotion instead of numbing — you strengthen new neural pathways. The old pathways don't disappear immediately, but they weaken from disuse.

This is why integration is a practice, not a one-time event. Repetition literally reshapes your brain.`
      },
      {
        title: 'The Emotional Brain',
        text: `Your brain has multiple systems that process emotions:

**The limbic system** (amygdala, hippocampus) handles emotional learning and memory. It's fast — it reacts before your thinking brain catches up. This is why triggers feel automatic.

**The prefrontal cortex** handles planning, decision-making, and regulation. It can modulate emotional responses, but it goes offline during intense stress or overwhelm.

**The insula** maps internal body states and generates the felt sense of emotions. It bridges body and mind.

Psychedelic experiences appear to temporarily increase connectivity between these systems, which may explain why insights feel so whole-body and profound.`
      },
      {
        title: 'Memory Reconsolidation',
        text: `When an emotional memory is activated, it briefly becomes malleable — open to updating. This is called memory reconsolidation, and it's a key mechanism in therapeutic change.

The process:
1. **Activate** the old emotional learning (the trigger, the pattern)
2. **Introduce a mismatch** — a new experience that contradicts what was expected
3. **The brain updates** the memory with new information

This is why integration after a psychedelic experience is so powerful — the experience often provides that mismatch naturally. Integration helps you consolidate the new learning before the old pattern reasserts itself.

The integration window (first 6-8 weeks) may correspond to this period of neural flexibility.`
      },
      {
        title: 'Default Mode Network',
        text: `The Default Mode Network (DMN) is a brain network active when you're self-referential — thinking about yourself, your story, your identity.

Research shows psychedelics temporarily quiet the DMN, which may explain:
• **Ego dissolution** — the sense of self loosens
• **New perspectives** — rigid self-narratives soften
• **Connectedness** — boundaries between self and world blur
• **Fresh seeing** — familiar things feel new

After the experience, the DMN comes back online. Integration is about incorporating insights before old patterns of self-reference fully re-establish.`
      },
      {
        title: 'Interpersonal Neurobiology',
        text: `Daniel Siegel's interpersonal neurobiology (IPNB) framework shows that the mind emerges from both the brain AND relationships. Your neural wiring was shaped by your earliest connections and continues to be shaped by current ones.

Key IPNB principles for integration:
• **Integration** in IPNB means linking differentiated parts into a coherent whole
• **Co-regulation** — being with a safe person literally calms your nervous system
• **Mindsight** — the ability to see your own mind and others' minds clearly
• **The triangle of well-being** — mind, brain, and relationships are interconnected

This is why integration circles, therapy, and trusted relationships are so valuable — they provide the relational context your brain needs for change.`
      }
    ],
    keyTakeaways: [
      'Neuroplasticity means your brain rewires through repeated practice',
      'Memory reconsolidation explains why integration timing matters',
      'The Default Mode Network quieting during psychedelics enables fresh perspectives',
      'Your brain changes through both internal practice and relationships',
      'Integration works with your brain\'s natural mechanisms for change'
    ]
  },

  {
    id: 'building_habits',
    title: 'Building Integration Habits',
    description: 'Use habit science to make your integration practices stick',
    emoji: '🔄',
    estimatedTime: '8 minutes',
    content: [
      {
        title: 'Why Habits Matter for Integration',
        text: `Insights without action fade. The most profound psychedelic experience means little if nothing changes in your daily life.

Habits are automated behaviors learned from experience. When repeated enough, they happen without conscious effort. This is exactly what you want for integration — practices that become part of who you are, not things you force yourself to do.

The research is clear: habits compound. Getting 1% better each day leads to remarkable transformation over time.`
      },
      {
        title: 'The Four Laws of Behavior Change',
        text: `Every habit follows a loop: Cue → Craving → Response → Reward. You can use four laws to build integration habits:

**1. Make it obvious** — Design your environment so cues for integration practices are visible. Put your journal on your pillow. Set a meditation cushion where you'll see it. Use implementation intentions: "After I pour my morning coffee, I will sit quietly for 2 minutes."

**2. Make it attractive** — Pair integration practices with something you enjoy. Journal while drinking your favorite tea. Do breathwork with music you love. Bundle a needed behavior with a rewarding one.

**3. Make it easy** — Reduce friction. Start with the "two-minute version" of any practice. Don't commit to 30 minutes of meditation — commit to sitting down. Momentum builds from there.

**4. Make it satisfying** — Track your streaks. Share progress with an accountability partner. Notice how you feel after practicing, not just during.`
      },
      {
        title: 'Identity-Based Integration',
        text: `The most powerful approach isn't focusing on outcomes ("I want to feel better") but on identity ("I am someone who integrates their experiences").

Ask yourself:
• Who is the type of person who successfully integrates psychedelic experiences?
• What would that person do today?
• What small action proves I am becoming that person?

Every time you journal, meditate, or check in with your nervous system, you cast a vote for that identity. You don't need a majority — just enough votes to shift the balance.`
      },
      {
        title: 'Habit Stacking for Integration',
        text: `Connect new integration practices to existing habits:

**Morning stack:**
"After I brush my teeth, I will do 3 conscious breaths."
"After my 3 breaths, I will check in with my nervous system state."
"After my check-in, I will set one intention for the day."

**Evening stack:**
"After I set my phone to charge, I will write one sentence in my journal."
"After I write in my journal, I will name one thing I'm grateful for."
"After my gratitude, I will do a body scan as I fall asleep."

Start with ONE link in the chain. Add more only after the first feels automatic.`
      },
      {
        title: 'When Habits Break Down',
        text: `Missing a day isn't failure — it's data. Notice what happened:

• **Too ambitious?** Scale back to the two-minute version
• **Environmental friction?** Redesign your space
• **Lost motivation?** Reconnect to why this matters to you
• **Life disruption?** Be compassionate and restart

The rule of thumb: never miss twice. Missing once is an accident. Missing twice is the start of a new pattern.

Remember that integration isn't about perfection — it's about returning, again and again, to what matters.`
      }
    ],
    keyTakeaways: [
      'Insights without habits fade — make integration automatic',
      'Use the four laws: make it obvious, attractive, easy, and satisfying',
      'Focus on identity ("I am someone who integrates") not outcomes',
      'Habit stack: attach new practices to existing routines',
      'Never miss twice — consistency matters more than perfection'
    ]
  },

  {
    id: 'cognitive_patterns',
    title: 'Cognitive Patterns & Distortions',
    description: 'Recognize thinking traps that block integration and learn to reframe them',
    emoji: '💭',
    estimatedTime: '9 minutes',
    content: [
      {
        title: 'What Are Cognitive Distortions?',
        text: `Cognitive distortions are habitual patterns of thinking that are inaccurate or biased. Everyone has them — they're how your brain takes shortcuts. But they can sabotage integration by filtering your experience through old, unhelpful lenses.

Cognitive Behavioral Therapy (CBT) identifies these patterns so you can catch them in action and choose a more balanced perspective.

This isn't about "positive thinking" — it's about accurate thinking.`
      },
      {
        title: 'Common Thinking Traps',
        text: `**All-or-Nothing Thinking:** "My experience was either life-changing or a waste." Reality has gradients.

**Catastrophizing:** "This difficult feeling means I'm permanently damaged." Difficult feelings are temporary.

**Mind Reading:** "People would think I'm crazy if I told them." You don't actually know what others think.

**Should Statements:** "I should be further along by now." Should creates shame, not motivation.

**Discounting the Positive:** "That moment of peace doesn't count because the rest was hard." All experiences count.

**Emotional Reasoning:** "I feel overwhelmed, so integration must not be working." Feelings aren't facts about progress.`
      },
      {
        title: 'The ABCs of Cognitive Restructuring',
        text: `A simple framework for working with distorted thoughts:

**A — Activating Event:** What happened? (Describe factually)
"I tried to meditate and felt anxious instead of peaceful."

**B — Belief:** What did you tell yourself about it?
"I'm doing this wrong. I'll never be good at integration."

**C — Consequence:** How did the belief make you feel/act?
"Felt discouraged. Stopped meditating for a week."

**D — Dispute:** Challenge the belief with evidence.
"Meditation isn't about feeling peaceful — it's about noticing. Anxiety arising IS the practice working."

**E — Effective new belief:**
"Noticing anxiety during meditation is a sign of awareness, not failure."`
      },
      {
        title: 'Thought Records for Integration',
        text: `When a difficult thought arises during integration:

1. **Name it** — "I notice I'm having the thought that..."
2. **Identify the distortion** — Which thinking trap is this?
3. **Evidence for** — What supports this thought?
4. **Evidence against** — What contradicts it?
5. **Balanced thought** — What's a more accurate perspective?

Example:
• Thought: "Nothing has changed since my experience."
• Distortion: Discounting the positive, all-or-nothing
• Evidence for: "I still feel stressed sometimes"
• Evidence against: "I've journaled 12 times, I caught myself before yelling yesterday, I noticed my breathing today"
• Balanced: "Change is gradual. I'm making small shifts that matter."`
      },
      {
        title: 'CBT Meets Psychedelic Integration',
        text: `Psychedelic experiences can both reveal and dissolve cognitive distortions:

**Revealed:** You might see clearly for the first time how a pattern of catastrophizing has run your life. The experience shows you the pattern from outside it.

**Dissolved:** The felt sense of interconnection can directly counter beliefs of worthlessness or isolation.

But old patterns are persistent. Integration uses CBT tools to:
• Catch distortions as they re-emerge after the experience
• Reinforce the new perspectives the experience revealed
• Build evidence-based confidence in your capacity to change
• Create concrete practices for when old thinking returns`
      }
    ],
    keyTakeaways: [
      'Cognitive distortions are normal shortcuts, not character flaws',
      'Common traps: all-or-nothing, catastrophizing, should statements',
      'Use the ABCDE framework to challenge unhelpful beliefs',
      'Psychedelic experiences can reveal distortions — CBT tools help you stay free of them',
      'The goal is accurate thinking, not positive thinking'
    ]
  },

  {
    id: 'core_beliefs',
    title: 'Core Beliefs & Deep Patterns',
    description: 'Discover the deep beliefs that shape your experience and learn to update them',
    emoji: '🪞',
    estimatedTime: '10 minutes',
    content: [
      {
        title: 'What Are Core Beliefs?',
        text: `Core beliefs are the deepest level of cognition — fundamental assumptions about yourself, others, and the world that feel like absolute truths rather than opinions.

They form early in life through experiences with caregivers, culture, and significant events. They operate below conscious awareness, silently shaping how you interpret everything.

Core beliefs act as filters: you notice information that confirms them and dismiss information that contradicts them. This is why they feel so "true" — you've been building evidence for them your whole life.`
      },
      {
        title: 'Three Categories of Core Beliefs',
        text: `**About the Self:**
• "I am unlovable" / "I am worthy of love"
• "I am incompetent" / "I am capable"
• "I am defective" / "I am whole"
• "I don't matter" / "I matter"

**About Others:**
• "People will abandon me" / "People are reliable"
• "Others can't be trusted" / "Most people mean well"
• "People are dangerous" / "Connection is safe"

**About the World:**
• "The world is unsafe" / "The world is manageable"
• "Life is unfair" / "Life has meaning"
• "Nothing ever works out" / "Things tend to work out"

Notice: these come in pairs. You likely hold a mix. The negative ones often formed in childhood to make sense of difficult experiences.`
      },
      {
        title: 'How Psychedelics Reveal Core Beliefs',
        text: `Psychedelic experiences often bring core beliefs to the surface with startling clarity:

• A feeling of unconditional love may directly contradict "I am unlovable"
• Dissolving boundaries may challenge "I am separate and alone"
• Encountering inner wisdom may update "I am incompetent"
• Feeling held by something larger may soften "The world is unsafe"

These experiences provide what therapists call a "corrective emotional experience" — a felt sense that contradicts the old belief at a deep, pre-verbal level.

The challenge: after the experience fades, old beliefs try to reassert themselves. Integration is the bridge between the momentary knowing and lasting change.`
      },
      {
        title: 'Working With Core Beliefs',
        text: `To identify your core beliefs, follow the "downward arrow":

Start with a surface thought: "I messed up that conversation."
Ask: "If that were true, what would that mean about me?"
→ "I'm socially awkward."
Ask again: "And if that were true, what would that mean?"
→ "People won't like me."
Again: "And what would that mean?"
→ "I'll end up alone." (Core belief: "I am unlovable / I will be abandoned")

Once identified:
1. **Acknowledge** the belief without judgment — it was adaptive once
2. **Gather evidence** — both for and against
3. **Find the origin** — when did you first learn this?
4. **Create an alternative** — what would you rather believe?
5. **Act as if** — behave as the new belief would suggest, collecting new evidence`
      },
      {
        title: 'Building New Core Beliefs',
        text: `You can't simply delete a core belief. You build a new one alongside it until the new one becomes stronger.

**Daily evidence log:** Each day, write one small piece of evidence for your new belief. "Today someone smiled at me" supports "I am likable."

**Behavioral experiments:** Test the old belief. If you believe "People always reject me," take a small social risk and notice what actually happens.

**Body-based updating:** The body holds beliefs too. Notice where the old belief lives in your body. Breathe into that space while holding the new belief in mind.

**Integration journaling:** After a psychedelic experience, specifically journal about moments that contradicted your core beliefs. These are integration gold.

Change happens at the speed of trust — trust in yourself, in the process, and in the new belief's validity.`
      }
    ],
    keyTakeaways: [
      'Core beliefs are deep assumptions formed early that feel like absolute truths',
      'They filter everything — you notice what confirms them',
      'Psychedelic experiences can directly contradict negative core beliefs',
      'Use the downward arrow technique to identify your core beliefs',
      'Build new beliefs through daily evidence, behavioral experiments, and embodied practice'
    ]
  },

  {
    id: 'trauma_understanding',
    title: 'Understanding Trauma',
    description: 'What trauma is, how it affects you, and how integration supports healing',
    emoji: '🌿',
    estimatedTime: '10 minutes',
    content: [
      {
        title: 'What Is Trauma?',
        text: `Trauma isn't just about what happened to you — it's about what happened inside you as a result. It's a rupture in connection: to yourself, to others, to a sense of safety in the world.

Trauma can come from:
• **Single events** — accidents, assaults, sudden losses
• **Prolonged experiences** — ongoing abuse, neglect, war
• **Developmental gaps** — what you needed but didn't receive as a child
• **Systemic causes** — oppression, discrimination, intergenerational patterns

What matters isn't the event itself but whether your nervous system was able to process it. Unprocessed experiences get "stuck" in survival mode.`
      },
      {
        title: 'How Trauma Lives in the Body',
        text: `When a threatening experience can't be fully processed, the body stores it:

• **Muscle tension** — chronic bracing against anticipated threat
• **Breathing patterns** — shallow, held, or erratic
• **Startle responses** — exaggerated reactions to unexpected stimuli
• **Dissociation** — disconnection from body sensations
• **Chronic pain** — the body expressing what words cannot

These aren't "imaginary" — they're real neurobiological patterns. The survival system that activated during the traumatic experience never fully turned off.

This is why talk therapy alone sometimes isn't enough. The body needs to complete its response.`
      },
      {
        title: 'Complex Trauma & Integration',
        text: `Complex trauma results from prolonged, repeated experiences — especially in childhood or in relationships where you couldn't escape.

Survivors of complex trauma often develop:
• Difficulty regulating emotions (too much or too little feeling)
• Challenges with identity and self-worth
• Relationship patterns that repeat the trauma
• Dissociative experiences
• A deep sense that something is fundamentally wrong with them

Psychedelic experiences can be particularly powerful — and particularly challenging — for complex trauma survivors. The opening that occurs can bring healing, but it can also temporarily overwhelm a system that's already at capacity.

**Important:** If you have complex trauma, working with a trauma-informed therapist alongside your integration practice is strongly recommended.`
      },
      {
        title: 'Trauma-Informed Integration Principles',
        text: `Whether or not you identify as having "trauma," these principles support safe integration:

**1. Safety first** — Integration only works when your nervous system feels safe enough. Build safety before diving deep.

**2. Titration** — Process small amounts at a time. You don't need to face everything at once. Think of a tea bag in water — let it steep slowly.

**3. Pendulation** — Move between the difficult material and resources (safety, comfort). This teaches your nervous system that it can touch pain and return to safety.

**4. Choice and agency** — You choose the pace. You choose what to explore. You can stop at any time. Reclaiming choice is itself healing.

**5. Completion** — Allow the body to finish survival responses that got interrupted. Shaking, crying, pushing away, running — these are completions, not breakdowns.`
      },
      {
        title: 'When to Seek Professional Support',
        text: `Integration is powerful, but some experiences need professional guidance:

**Seek support if:**
• You're experiencing flashbacks or intrusive memories
• Dissociation is increasing or feels uncontrollable
• You're unable to function in daily life
• Self-harm thoughts are present
• You feel stuck in a trauma response for days or weeks
• The psychedelic experience activated material you can't process alone

**What to look for in a therapist:**
• Trauma-informed training (EMDR, Somatic Experiencing, Sensorimotor Psychotherapy)
• Openness to psychedelic integration
• Focus on safety and pacing (not rushing to "the material")
• A good felt sense of safety when you're with them

Seeking help is not weakness — it's wisdom. Some healing requires a witness.`
      }
    ],
    keyTakeaways: [
      'Trauma is about what happened inside you, not just what happened to you',
      'The body stores unprocessed experiences as tension, pain, and survival patterns',
      'Complex trauma needs extra care — work with a professional if this resonates',
      'Key principles: safety first, titration, pendulation, choice, completion',
      'Seeking professional support when needed is wisdom, not weakness'
    ]
  },

  {
    id: 'attachment_styles',
    title: 'Attachment & Relationships',
    description: 'How your attachment patterns shape your inner world and relationships',
    emoji: '🤝',
    estimatedTime: '9 minutes',
    content: [
      {
        title: 'What Is Attachment?',
        text: `Attachment theory, developed by John Bowlby and Mary Ainsworth, describes how your earliest relationships with caregivers shaped your expectations about connection, safety, and love.

These patterns aren't just childhood relics — they actively shape how you relate to partners, friends, yourself, and even your psychedelic experiences.

Your attachment style isn't a permanent label. It's a set of learned patterns that can be updated through new experiences — including integration work.`
      },
      {
        title: 'The Four Attachment Styles',
        text: `**Secure:** "I'm okay, you're okay."
• Comfortable with closeness and independence
• Can ask for help and offer it
• Processes emotions effectively
• Formed when caregivers were consistently responsive

**Anxious-Preoccupied:** "I need closeness to feel okay."
• Craves connection but fears abandonment
• May become clingy or people-pleasing
• Emotions feel big and hard to regulate alone
• Formed when caregivers were inconsistently available

**Dismissive-Avoidant:** "I'm fine on my own."
• Values independence, uncomfortable with closeness
• May suppress emotions or intellectualize
• Difficulty asking for or receiving help
• Formed when caregivers were emotionally unavailable

**Fearful-Avoidant (Disorganized):** "I want closeness but it scares me."
• Desires connection but expects pain
• Push-pull pattern in relationships
• May dissociate during emotional intensity
• Often formed in environments with frightening caregivers`
      },
      {
        title: 'Attachment and Psychedelic Experiences',
        text: `Your attachment style influences how you experience psychedelics and integration:

**Anxious style:** May seek constant reassurance after experiences. Integration benefit: learning that you can hold your own experience without external validation.

**Avoidant style:** May intellectualize the experience or dismiss emotional content. Integration benefit: allowing the felt sense to matter without needing to "understand" everything.

**Disorganized style:** May experience intense activation or dissociation. Integration benefit: building internal safety so connection doesn't equal danger. Extra care and professional support recommended.

**Secure style:** Generally integrates more fluidly but may be challenged by experiences that shake their sense of safety. Integration benefit: expanding capacity for uncertainty.`
      },
      {
        title: 'Earned Security',
        text: `The good news: you can develop "earned security" regardless of your early experiences. This happens through:

• **Therapy** — A consistent, attuned therapeutic relationship rewires attachment patterns
• **Secure relationships** — Being with people who are reliably responsive
• **Self-awareness** — Recognizing your patterns without judgment
• **Integration work** — Processing the experiences that shaped your attachment style
• **Internal work** — Building a secure relationship with yourself

Psychedelic experiences often provide glimpses of secure attachment — the feeling of being unconditionally held, accepted, loved. Integration anchors these glimpses into lasting neural change.`
      },
      {
        title: 'Practices for Attachment Healing',
        text: `**For anxious patterns:**
• Practice sitting with discomfort without reaching for reassurance
• Build self-soothing skills (your hands on your own heart)
• Notice when you're okay on your own — collect evidence

**For avoidant patterns:**
• Practice naming emotions with one trusted person
• Let yourself need someone — start small
• Notice the body's response to closeness (it may feel threatening; that's information)

**For disorganized patterns:**
• Prioritize safety — build predictable routines and relationships
• Work with a trauma-informed therapist
• Practice grounding before exploring relational territory

**For everyone:**
• Journal about what safety in connection feels like
• Notice your patterns without making them wrong
• Celebrate small moments of secure connection`
      }
    ],
    keyTakeaways: [
      'Attachment patterns form early but can be updated throughout life',
      'Your attachment style influences how you experience and integrate psychedelics',
      'Earned security is possible through therapy, relationships, and self-awareness',
      'Different attachment styles benefit from different integration approaches',
      'Building secure connection with yourself is the foundation for all other healing'
    ]
  },

  {
    id: 'harm_reduction',
    title: 'Harm Reduction & Safety',
    description: 'Practical safety knowledge for responsible psychedelic use',
    emoji: '🛟',
    estimatedTime: '8 minutes',
    content: [
      {
        title: 'What Is Harm Reduction?',
        text: `Harm reduction is a practical approach that acknowledges people will make their own choices about psychedelic use, and focuses on minimizing risks rather than demanding abstinence.

It's not pro-drug or anti-drug — it's pro-safety and pro-informed-choice.

Key principles:
• Meet people where they are, without judgment
• Provide accurate, evidence-based information
• Prioritize safety and well-being
• Respect autonomy and personal choice
• Recognize that risk exists on a spectrum`
      },
      {
        title: 'Set and Setting',
        text: `The two most important factors in any psychedelic experience:

**Set (Mindset):**
• Your emotional state going in
• Your intentions and expectations
• Unresolved fears or anxieties
• Physical health and energy level
• Relationship with the substance

**Setting (Environment):**
• Physical safety and comfort
• Who is present (trusted, sober sitters)
• Noise level, lighting, temperature
• Access to water, blankets, nature
• Absence of responsibilities or interruptions

A challenging experience in a good set and setting can be deeply healing. A mild experience in a poor set and setting can be destabilizing. The container matters enormously.`
      },
      {
        title: 'Preparation Practices',
        text: `Before any experience:

**Physical:**
• Research substance interactions (especially SSRIs, MAOIs, lithium)
• Fast appropriately if relevant
• Ensure adequate sleep in preceding days
• Have water and light food available

**Psychological:**
• Set clear intentions (not rigid expectations)
• Address any major life stressors if possible
• Have a trusted sitter or guide arranged
• Know your emergency plan

**Practical:**
• Clear your schedule for the experience AND the next day
• Prepare your space (comfortable, clean, meaningful objects)
• Have a journal ready for after
• Phone on airplane mode
• Let someone trustworthy know where you are`
      },
      {
        title: 'During Difficult Moments',
        text: `If things become challenging during an experience:

• **Change the music** — Music profoundly shapes the experience
• **Change position** — Sit up, lie down, move to another room
• **Breathe** — Slow, extended exhales activate the calming response
• **Remember impermanence** — "This will pass. I am safe."
• **Surrender, don't fight** — Resistance intensifies difficulty
• **Ground** — Feel the floor, hold something physical
• **Connect** — Let your sitter know you need support

For a sitter supporting someone:
• Stay calm and present
• Minimal words, maximum reassurance
• "You're safe. I'm here. This will pass."
• Don't try to "fix" the experience
• Physical comfort if welcome (blanket, water, gentle touch)`
      },
      {
        title: 'Contraindications & Risks',
        text: `**Medical contraindications:**
• Personal or family history of psychotic disorders
• Certain heart conditions (with stimulant psychedelics)
• Pregnancy
• Lithium use (dangerous interaction)
• MAOI interactions (specific to certain substances)

**Psychological risks:**
• Can surface repressed trauma unexpectedly
• May destabilize fragile mental health
• Can reinforce negative patterns without proper integration
• Risk of spiritual bypassing (using experiences to avoid real work)

**Risk reduction:**
• Know what you're taking (test kits are available)
• Start with lower amounts
• Never use alone (have a sitter)
• Don't mix substances
• Don't drive or operate machinery
• Have professional support resources identified in advance

This app supports integration — the work that happens after. If you need crisis support, contact the Fireside Project (62-FIRESIDE) or your local emergency services.`
      }
    ],
    keyTakeaways: [
      'Harm reduction prioritizes safety and informed choice',
      'Set (mindset) and setting (environment) are the most important safety factors',
      'Preparation and having a sitter dramatically reduce risk',
      'During difficulty: breathe, ground, surrender, connect',
      'Know contraindications and have support resources ready'
    ]
  },

  {
    id: 'contemplative_practices',
    title: 'Contemplative & Mindfulness Practices',
    description: 'Meditation, mindfulness, and contemplative approaches to integration',
    emoji: '🧘',
    estimatedTime: '9 minutes',
    content: [
      {
        title: 'Contemplative Traditions & Integration',
        text: `For thousands of years, contemplative traditions have developed practices for working with altered states, expanded awareness, and the integration of profound experiences.

You don't need to adopt any religious framework to benefit from these practices. At their core, they teach:
• How to sit with what arises without running
• How to observe the mind without being lost in it
• How to hold paradox and uncertainty
• How to let experiences transform you at their own pace

These are exactly the skills integration requires.`
      },
      {
        title: 'Basic Meditation for Integration',
        text: `A simple practice for integration — no experience needed:

**Sit still. What continues to move should be observed.**

That's it. The rest is detail:

1. Find a comfortable position (sitting, lying down, walking slowly)
2. Set a timer (start with 5 minutes)
3. Let your attention rest on whatever is present — breath, sounds, body sensations
4. When your mind wanders (it will), notice where it went and gently return
5. There is nothing to achieve, fix, or figure out

What arises during meditation after a psychedelic experience can be rich integration material. Emotions, images, body sensations, memories — let them come, observe them, let them go.

The meditation isn't about making them stop. It's about changing your relationship to them.`
      },
      {
        title: 'Mindful Awareness in Daily Life',
        text: `You don't need to sit on a cushion to practice. Integration happens in ordinary moments:

**Mindful transitions:** Pause between activities. Three breaths before starting something new.

**Mindful eating:** One meal a week, eat without screens. Notice taste, texture, the act of nourishing yourself.

**Mindful walking:** Feel each step. Notice the ground meeting your foot. Let walking be enough.

**Mindful listening:** When someone speaks, just listen. Notice the urge to formulate your response. Let it go.

**Mindful pausing:** When a strong emotion arises, pause before acting. Name it. Feel where it lives in your body. Then choose your response.

These micro-practices accumulate. They train the same awareness muscle that supports integration.`
      },
      {
        title: 'Working With Difficult States',
        text: `Contemplative traditions offer specific approaches for difficult states that arise during integration:

**RAIN practice (Tara Brach):**
• **R**ecognize — "This is anxiety"
• **A**llow — Let it be here without pushing away
• **I**nvestigate — Where do I feel it? What does it need?
• **N**urture — Offer yourself kindness

**Tonglen (Tibetan Buddhist):**
• Breathe in suffering (yours or others')
• Breathe out compassion and relief
• Transforms the instinct to avoid pain into active engagement

**Non-attachment:**
Not detachment or indifference — it's holding things lightly. You can care deeply without clinging to outcomes. This is especially important for integration: hold your insights with open hands.`
      },
      {
        title: 'The Contemplative Attitude',
        text: `More important than any technique is the underlying attitude:

**Beginner's mind** — Approach each moment as if for the first time. Your psychedelic experience showed you this capacity. Meditation sustains it.

**Non-striving** — You can't force insight. You create conditions and then wait. Integration is the same.

**Radical acceptance** — Whatever arises is workable. Nothing that's true about you is an obstacle to your healing.

**Compassion** — Toward yourself first, then extending outward. Integration without self-compassion becomes another form of self-improvement tyranny.

**Patience** — The fruit ripens in its own time. Your integration will unfold. Trust the process while showing up for the practice.`
      }
    ],
    keyTakeaways: [
      'Contemplative traditions have millennia of experience with integration',
      'Simple meditation: sit still, observe what moves — no special technique needed',
      'Daily mindfulness (eating, walking, pausing) builds integration capacity',
      'RAIN and other practices offer structured ways to work with difficult states',
      'The attitude matters more than the technique: beginner\'s mind, non-striving, compassion'
    ]
  },

  {
    id: 'psychedelic_preparation',
    title: 'Preparation & The Integration Arc',
    description: 'The full arc from preparation through experience to long-term integration',
    emoji: '🌅',
    estimatedTime: '12 minutes',
    content: [
      {
        title: 'The Integration Arc',
        text: `Integration isn't just what happens after — it's a full arc:

**Before: Preparation (weeks to months)**
Setting intentions, building support, getting your life container stable

**During: The Experience**
Surrendering to the process, being present with what arises

**After: Acute Integration (days to weeks)**
Processing, journaling, making meaning, resting

**Ongoing: Deep Integration (weeks to months)**
Embodying changes, adjusting life patterns, maintaining practices

**Long-term: Living Integration (months to years)**
The experience becomes part of your story, informing how you live

Each phase has different needs and practices. This app primarily supports the "after" and "ongoing" phases, but understanding the full arc helps you navigate the whole journey.`
      },
      {
        title: 'Preparation: Building the Container',
        text: `Good preparation is itself integration work:

**Internal preparation:**
• Clarify your intentions (not expectations or demands)
• Address fears and concerns honestly
• Begin or deepen a meditation/contemplative practice
• Start journaling if you don't already
• Check in with your nervous system — build regulation skills first

**Relational preparation:**
• Identify your integration support team (therapist, friends, guide)
• Have honest conversations with close people about what you're doing
• Set up integration sessions in advance
• Connect with integration communities

**Practical preparation:**
• Clear space in your calendar (experience + recovery days)
• Handle logistical stressors in advance
• Prepare your physical space
• Gather tools: journal, art supplies, comfort items`
      },
      {
        title: 'The First 24-48 Hours',
        text: `The period immediately after an experience is precious and delicate:

**Do:**
• Rest — your brain and body have been through a lot
• Hydrate and eat nourishing food
• Be in nature if possible
• Journal raw impressions before they fade
• Let emotions flow without analysis
• Accept care from your sitter or support person

**Don't:**
• Rush back to work or responsibilities
• Try to "figure it all out" immediately
• Share on social media or with everyone
• Make major life decisions
• Judge the experience as good or bad
• Use other substances to "extend" or "process"

Think of yourself as a newborn in these hours — fresh, sensitive, and needing gentle care.`
      },
      {
        title: 'The First Six Weeks',
        text: `Research and clinical experience suggest enhanced neuroplasticity in the weeks following a psychedelic experience. This is your integration window:

**Week 1-2: Gathering**
• Journal everything you remember
• Note emotions, body sensations, images, messages
• Don't interpret yet — just collect
• Use the Johnson framework's Phase 1

**Week 2-4: Connecting**
• Begin finding patterns and connections
• What resonates with your life?
• What are the themes?
• What is surprising?
• Use the Johnson framework's Phases 2-3

**Week 4-6: Embodying**
• What practices support the insights?
• What changes are you making?
• What rituals honor the experience?
• Use the Johnson framework's Phase 4

**Throughout:** Maintain your regulation practices, stay connected to support, and be patient with the process.`
      },
      {
        title: 'Long-Term Integration',
        text: `The deepest integration often happens months or years later:

• **Revisitation** — You may return to the same experience and find entirely new meaning. This is normal and valuable.

• **Spiral processing** — Integration isn't linear. You may revisit themes in deeper layers, like peeling an onion.

• **Life as integration** — Eventually, the practices become how you live, not something separate you "do." Your daily life becomes the integration.

• **Community** — Long-term integration benefits from ongoing connection with others who understand the territory.

• **Gratitude practice** — Regularly acknowledging how the experience has changed you keeps the connection alive.

Remember: the goal was never the experience itself. The goal is who you become through the integration. The experience is the seed. Your life is the garden.`
      }
    ],
    keyTakeaways: [
      'Integration is a full arc: preparation → experience → processing → embodiment → living',
      'Preparation is itself integration work — build the container before the experience',
      'The first 48 hours require rest, gentleness, and raw documentation',
      'The 6-week integration window aligns with enhanced neuroplasticity',
      'Long-term integration is spiral, not linear — the same experience yields new meaning over time'
    ]
  },

  {
    id: 'acceptance_commitment',
    title: 'Acceptance & Commitment (ACT)',
    description: 'Learn psychological flexibility through acceptance, values, and committed action',
    emoji: '🎯',
    estimatedTime: '9 minutes',
    content: [
      {
        title: 'What Is ACT?',
        text: `Acceptance and Commitment Therapy (ACT, said as one word "act") is a modern therapeutic approach that doesn't try to eliminate difficult thoughts and feelings. Instead, it helps you change your relationship to them.

ACT is built on a simple premise: suffering comes not from pain itself, but from our attempts to avoid, control, or struggle with pain. When you stop fighting your inner experience and instead focus on what matters to you, transformation becomes possible.

This is remarkably aligned with psychedelic integration — the experience often teaches you to surrender rather than control.`
      },
      {
        title: 'The Six Core Processes',
        text: `ACT develops psychological flexibility through six interconnected processes:

**1. Acceptance** — Opening up to difficult experiences rather than avoiding them. Not resignation — active willingness. "I can feel this anxiety AND still do what matters."

**2. Cognitive Defusion** — Unhooking from thoughts. Instead of "I'm broken," try "I'm having the thought that I'm broken." The thought loses its grip.

**3. Present Moment Awareness** — Contacting the here and now. Similar to mindfulness — noticing what's happening right now without getting lost in past or future.

**4. Self-as-Context** — You are the sky, not the weather. Your thoughts and feelings pass through you but they are not you. You are the awareness that observes them.

**5. Values** — Clarifying what truly matters to you. Not goals (achievable) but directions (ongoing). Like a compass heading you can always move toward.

**6. Committed Action** — Taking concrete steps aligned with your values, even when it's uncomfortable. This is where integration becomes real.`
      },
      {
        title: 'Defusion Techniques',
        text: `Defusion helps you step back from thoughts that hook you:

**Name the story:** "Ah, there's the 'not good enough' story again." When you name it as a story, you're no longer inside it.

**Silly voice:** Repeat a troubling thought in a cartoon voice. Notice how it changes your relationship to it.

**"I notice..." prefix:** Instead of "I'm a failure," say "I notice I'm having the thought that I'm a failure." This creates distance.

**Thoughts on leaves:** Visualize placing each thought on a leaf floating down a stream. Watch them pass without grabbing.

**Thank your mind:** "Thanks, mind, for trying to protect me with that thought. I see what you're doing."

These aren't about dismissing thoughts — they're about seeing them for what they are: mental events, not truths.`
      },
      {
        title: 'Values Clarification',
        text: `Values give integration direction. Without them, insights float without anchoring.

Ask yourself in key life domains:
• **Relationships:** What kind of partner, friend, parent do I want to be?
• **Growth:** What does living a meaningful life look like?
• **Work/Contribution:** What do I want to give to the world?
• **Health/Body:** How do I want to relate to my physical self?
• **Spirituality/Inner Life:** What's my relationship to something larger?

Then ask: "Did my psychedelic experience show me something about what I truly value?" Often the answer reveals values you've been neglecting.

Values aren't should's — they're deep callings. When you feel pulled toward something rather than pushed, you've found a value.`
      },
      {
        title: 'Committed Action & Integration',
        text: `The final step in ACT — and in integration — is action:

**Start small:** What's the smallest action aligned with your values that you can take today? Not someday. Today.

**Expect discomfort:** Values-driven action often involves doing hard things. Acceptance helps you carry the discomfort along rather than waiting until you feel "ready."

**Willingness over motivation:** Motivation fluctuates. Willingness is a choice. "Am I willing to feel this anxiety in service of what matters to me?"

**Integration as committed action:** Every time you journal, meditate, reach out for support, or practice a new pattern, you're taking committed action. You're saying: "This experience matters enough to change my life for."

The question isn't "How do I feel?" but "What am I willing to do in service of my deepest values?"`
      }
    ],
    keyTakeaways: [
      'ACT teaches psychological flexibility — changing your relationship to difficult experiences',
      'Defusion techniques help you unhook from troubling thoughts',
      'Values give integration direction — they\'re compasses, not destinations',
      'Committed action means acting on values even when it\'s uncomfortable',
      'The goal is a rich, meaningful life — not the absence of pain'
    ]
  }
];

/**
 * Helper function to get topic by ID
 */
export const getTopicById = (topicId) => {
  return educationTopics.find(topic => topic.id === topicId);
};

/**
 * Helper function to get all topic titles for navigation
 */
export const getAllTopicTitles = () => {
  return educationTopics.map(topic => ({
    id: topic.id,
    title: topic.title,
    emoji: topic.emoji
  }));
};
