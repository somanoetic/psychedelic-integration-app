/**
 * Simulated User Personas for Conversation Bot Testing
 *
 * Each persona has a mode, a name, and a script of user messages.
 * The bot sends these messages sequentially to huxleyService.chat(),
 * collecting AI responses into a transcript.
 *
 * Two approaches:
 * 1. SCRIPTED: Fixed user messages (deterministic, good for regression)
 * 2. ADAPTIVE: AI-generated user messages that respond to Huxley (richer, requires API)
 *
 * This file provides the SCRIPTED personas.
 */

// =============================================================================
// IFS PARTS WORK — "Alex" exploring an inner critic
// =============================================================================

const ifsPersona = {
  mode: 'ifs',
  name: 'Alex — Inner Critic Exploration',
  description: 'User exploring a harsh inner critic that emerged after a psilocybin session',
  turns: [
    "I've been noticing this really harsh voice in my head since my session last week. It keeps telling me I'm not doing enough.",
    "Yeah, it's like a constant critic. Always judging everything I do. It got louder after the ceremony.",
    "I notice it mostly in my chest, like a tightness. And my jaw clenches when it gets going.",
    "I think I feel... frustrated with it. Like, why can't it just shut up? I'm so tired of it.",
    "Okay, I can try. I guess I notice that... it does seem worried. Like it's trying to keep me from failing.",
    "It's been around since I was a kid. My dad was very critical and I think this part learned to beat him to the punch.",
    "That actually makes me feel sad for it. Like it's been working so hard all these years just to protect me.",
    "I think it's afraid that if it stops criticizing me, I'll become lazy or complacent and people will reject me.",
    "I want to tell it that I appreciate what it's done. Even though it's been painful, I understand why it's there.",
    "I feel calmer now. Like there's more space between me and that critical voice. Thank you for guiding me through this.",
  ],
};

// =============================================================================
// NERVOUS SYSTEM MAPPING — "Jordan" mapping autonomic states
// =============================================================================

const nervousSystemMappingPersona = {
  mode: 'nervous_system_mapping',
  name: 'Jordan — Autonomic Mapping',
  description: 'User doing their first full nervous system map after an ayahuasca retreat',
  turns: [
    "When I leave my safe place, I definitely go more toward activation. Fight or flight. My mind starts racing and I get this urgency in my body.",
    "A specific time... yeah, last week at work when my boss called an emergency meeting. My stomach dropped and my heart started pounding immediately.",
    "Okay, letting myself feel a little of that... I notice my shoulders are creeping up toward my ears. My breath gets shallow. My hands feel a bit sweaty.",
    "The overall feeling is like urgency. Like I need to DO something right now or something terrible will happen.",
    "When I'm activated like that, I tend to over-prepare. I'll work late, make lists obsessively, check my email every two minutes. It's hard to sit still.",
    "Communication gets clipped. I become very direct, almost sharp. I might snap at my partner or seem distracted. I don't want to talk about feelings.",
    "My thoughts race. It's like having 15 browser tabs open. I can't focus on one thing because my brain keeps jumping to the next worry.",
    "Sleep is terrible when I'm activated. I'll lie awake making mental lists, or wake up at 3am with my mind already going.",
    "I lose my appetite when I'm stressed. I might skip lunch and not even notice until 4pm. Or I'll eat really fast without tasting anything.",
    "When I'm in this state... I am not enough. The world is demanding and I have to keep up or I'll fall behind.",
    "For shutdown, I think of the weekend after that work crisis. I just couldn't get off the couch. Everything felt pointless.",
    "Letting a little of that in... it's like heaviness. My limbs feel heavy, my eyelids want to close. There's a fog.",
    "The feeling is emptiness. Like the color has drained out of everything. Nothing seems worth the effort.",
    "I just scroll my phone. Hours can go by. Or I'll binge-watch shows. I can't make decisions, even small ones like what to eat.",
    "I go silent. I don't want to talk to anyone. If someone calls I let it go to voicemail. Even texting feels like too much effort.",
    "Thinking just... stops. It's not racing anymore, it's the opposite. Like wading through mud. Everything is slow and dull.",
    "When I'm in this state... I am broken. The world is gray and nothing matters.",
    "For my safe state — I think of sitting on the porch with my dog in the morning, just the two of us with coffee.",
    "Yes, really sinking into that... I feel warm in my chest. My breathing is slow and easy. My shoulders are down. There's this sense of... enough. Just being is enough.",
    "When I'm in this state... I am whole. The world is beautiful and I belong in it.",
  ],
};

// =============================================================================
// JOURNAL — "Sam" processing a challenging ceremony
// =============================================================================

const journalPersona = {
  mode: 'journal',
  name: 'Sam — Post-Ceremony Processing',
  description: 'User journaling about a difficult but transformative psilocybin ceremony',
  turns: [
    "I want to write about my ceremony from Saturday. It was intense and I'm still processing.",
    "It started beautiful — I saw these incredible geometric patterns and felt this deep sense of connection to everything. But then it shifted.",
    "I was taken to this memory of my mom leaving when I was seven. I felt the full weight of that abandonment for the first time as an adult.",
    "I was crying a lot. The facilitator held space and I just let it move through me. It felt like grief I'd been carrying for twenty years.",
    "I realized that so much of my people-pleasing comes from that moment. This belief that if I'm good enough, people won't leave me.",
    "The insight is clear in my head but I'm struggling to feel it in daily life. Like yesterday I caught myself over-apologizing to a coworker for no reason.",
    "I think what I need most right now is to be gentle with myself. The ceremony showed me these patterns but I don't have to fix everything overnight.",
    "Thank you. Writing this out helps me see the thread more clearly. The abandonment, the people-pleasing, the over-apologizing — it's all connected.",
  ],
};

// =============================================================================
// CORE BELIEFS — "River" exploring limiting beliefs
// =============================================================================

const coreBeliefsPersona = {
  mode: 'core_beliefs',
  name: 'River — Core Beliefs Exploration',
  description: 'User exploring core beliefs that surfaced during ketamine therapy',
  turns: [
    "I keep hitting this wall in my integration work. There's this deep belief that I'm fundamentally flawed.",
    "It shows up everywhere. In relationships, I'm always waiting for the other shoe to drop. At work, I feel like a fraud even though I'm competent.",
    "I think it started with my parents' divorce. I was eight and somehow decided it was my fault. Like if I'd been a better kid, they would have stayed together.",
    "During my ketamine sessions I could actually see this belief as separate from me. Like it was a layer of film over everything but not actually ME.",
    "That's the confusing part. In the session it felt so clear — of course I'm not flawed, that was a child's interpretation. But back in daily life the belief reasserts itself.",
    "The physical sensation is a sinking in my stomach. Like shame has a home there. When someone gives me a compliment I literally feel it pull me down.",
    "I want to believe I'm worthy of love without having to earn it. That I can just exist and that's enough. The ketamine showed me that's possible.",
    "I think the new belief might be something like... I was always enough. The divorce wasn't about me, and my worth doesn't depend on being perfect.",
  ],
};

// =============================================================================
// TRIGGERS & GLIMMERS — "Casey" identifying patterns
// =============================================================================

const triggersGlimmersPersona = {
  mode: 'triggers_glimmers',
  name: 'Casey — Triggers & Glimmers Discovery',
  description: 'User learning to identify nervous system triggers and glimmers post-integration',
  turns: [
    "I've been trying to notice my triggers and glimmers this week but I'm not sure I'm doing it right.",
    "Okay so yesterday, I was in a meeting and my manager interrupted me mid-sentence. I felt this immediate flush of heat in my face and my fists clenched under the table.",
    "It happens a lot when I feel unheard. Like my voice doesn't matter. It's been a pattern since childhood honestly.",
    "For glimmers — I had this moment yesterday walking home. The sun was coming through the trees and I just felt this spontaneous sense of peace. It lasted maybe 30 seconds.",
    "I also noticed a glimmer when my cat jumped on my lap while I was reading. This warmth spread through my chest. It was very subtle but I caught it.",
    "Another trigger — I got a text from my ex and my whole body tensed up. My breathing got shallow and I started planning what to say even though I didn't need to respond.",
    "I'm starting to see that my triggers are mostly about feeling powerless or unseen, and my glimmers are about connection and beauty. Is that normal?",
    "This is really helpful. I feel like I'm building a map of what helps and what hurts. The glimmers are like breadcrumbs back to safety.",
  ],
};

// =============================================================================
// REGULATING RESOURCES — "Morgan" building a toolkit
// =============================================================================

const regulatingResourcesPersona = {
  mode: 'regulating_resources',
  name: 'Morgan — Regulation Toolkit',
  description: 'User building their regulation toolkit after a challenging MDMA session',
  turns: [
    "I want to figure out what actually helps me regulate. Since my MDMA session I've been more aware of my nervous system but I don't always know what to do.",
    "When I'm activated, the thing that helps most is cold water on my face. Or stepping outside and feeling the air. Something physical and immediate.",
    "For grounding, I use this technique where I name five things I can see. It works but sometimes I need something faster.",
    "Movement helps a lot too. Even just shaking my hands or doing a few jumping jacks. It's like my body needs to discharge the energy.",
    "When I'm shutdown, that's harder. Sometimes music helps — specifically bass-heavy music, like my body needs to be vibrated back to life.",
    "My cat is a huge resource. When I feel her purring on my chest, something in my nervous system clicks back into place. It's like instant co-regulation.",
    "I don't have many social resources though. I tend to isolate when I'm dysregulated. My therapist says I should reach out to people but it feels impossible in the moment.",
    "This is a great snapshot of where I am. Cold water, movement, my cat, and music are my go-to tools. I need to build up the social regulation side.",
  ],
};

// =============================================================================
// EXPERIENCE MAPPING — "Riley" processing a ceremony
// =============================================================================

const experienceMappingPersona = {
  mode: 'experience_mapping',
  name: 'Riley — Ceremony Experience Mapping',
  description: 'User mapping their recent psilocybin ceremony experience',
  turns: [
    "I had a psilocybin ceremony three days ago and I want to map out what happened. It was a 5-gram journey.",
    "The first phase was this dissolving sensation. My body boundaries melted and I became part of the room, the music, the other people. It was terrifying and beautiful.",
    "The peak was the most significant part. I had a vision of myself as a child being held by something vast and loving. I realized I've been looking for that holding my whole life.",
    "There was a difficult stretch where I felt like I was dying. Not physically, but like my ego, my identity was crumbling. I wanted it to stop but the facilitator reminded me to breathe.",
    "What surprised me was the humor. At some point I started laughing at how seriously I take everything. This cosmic joke quality — like the universe is playful.",
    "The comedown was very tender. I felt raw and open, like a newborn. Every sensation was vivid. The texture of the blanket, the sound of someone breathing.",
    "The key insight is that I don't have to hold everything together alone. That holding I experienced — I think it's always available if I let myself be held.",
    "I want to bring that sense of being held into my daily life. Not the psychedelic part, but the willingness to let go and trust.",
  ],
};

// =============================================================================
// INTENTION SETTING — "Dakota" setting an intention
// =============================================================================

const intentionPersona = {
  mode: 'intention',
  name: 'Dakota — Pre-Session Intention',
  description: 'User setting an intention before an upcoming psilocybin session',
  turns: [
    "I have a ceremony coming up this weekend and I want to set a clear intention.",
    "I've been working on self-worth issues in therapy. My therapist suggested I bring that into the ceremony space.",
    "Specifically, I want to explore why I always put others first to the point of self-abandonment. There's a pattern of martyrdom that I'd like to understand better.",
    "I think the intention might be something like 'show me the root of my self-abandonment.' But I'm not sure if that's too specific.",
    "You're right, maybe something more open. Like 'help me understand my relationship with giving and receiving.'",
    "I feel good about that. It's open enough to allow for whatever the medicine wants to show me, but focused enough to guide the experience.",
    "For preparation, I've been meditating daily and I've cleared my schedule for three days after. My partner knows to give me space.",
    "Thank you. I feel ready and grounded in my intention. I'll carry this with me into the ceremony.",
  ],
};

// =============================================================================
// THERAPEUTIC INTEGRATION — "Sage" long-term integration
// =============================================================================

const therapeuticIntegrationPersona = {
  mode: 'therapeutic_integration',
  name: 'Sage — Long-term Integration',
  description: 'User working on integrating insights from multiple ceremonies over six months',
  turns: [
    "I've had three ceremonies over the past six months and I feel like the insights are piling up but I'm not integrating them fast enough.",
    "The big theme across all three has been about control. I saw how I try to control everything — my environment, my relationships, even my emotions.",
    "In my first ceremony I saw it as a literal cage I'd built around myself. In the second, I watched myself building it brick by brick from childhood experiences.",
    "The third ceremony was about the cost. I saw all the joy, connection, and spontaneity that my need for control had kept out. I cried for hours.",
    "In daily life, I notice the control patterns but I can't always stop them. Like last week I rewrote my partner's grocery list because it wasn't organized the way I like.",
    "I've started practicing small surrenders. Letting my partner choose the restaurant. Taking a different route home. Not checking my work email after 6pm.",
    "The hardest part is sitting with the discomfort when I let go. My nervous system screams that something bad will happen if I'm not in control.",
    "I think the ceremonies showed me the direction but the integration happens in these small daily moments. Thank you for helping me see that more clearly.",
  ],
};

// =============================================================================
// ACTIVE IMAGINATION — "Ember" exploring dream imagery
// =============================================================================

const activeImaginationPersona = {
  mode: 'active_imagination',
  name: 'Ember — Dream Imagery Exploration',
  description: 'User exploring a recurring dream image through active imagination',
  turns: [
    "I keep having this dream about a door in a forest. The door stands alone, no walls, just a wooden door surrounded by trees. I never open it.",
    "The forest feels old and deep. The trees are massive, covered in moss. The light is green and filtered. It feels sacred but also a little frightening.",
    "When I approach the door I feel drawn to it but also resistant. My hand reaches for the handle but I always wake up before I turn it.",
    "If I imagine opening it now... I see a garden on the other side. But it's overgrown, wild, not maintained. There's a stone well in the center.",
    "The well feels important. When I look down into it, I can see my reflection but it's not quite me — it's younger, softer, less defended.",
    "That younger version looks up at me and says 'I've been waiting for you.' I feel tears welling up. There's so much tenderness.",
    "I think the overgrown garden represents the parts of myself I've neglected — creativity, play, vulnerability. The things I walled off to survive.",
    "I want to tend this garden. Not control it, but visit it. Water it. Let it grow wild but know it's there. That feels like the invitation.",
  ],
};

// =============================================================================
// GENERAL CHAT — "Quinn" general integration conversation
// =============================================================================

const generalPersona = {
  mode: 'general',
  name: 'Quinn — General Integration Chat',
  description: 'User having a general conversation about their integration journey',
  turns: [
    "Hi Huxley. I just need to talk through something. My integration journey feels stuck.",
    "It's been two months since my last ceremony and the initial glow has faded. I'm back in old patterns and it's discouraging.",
    "Like, during the experience I had this profound knowing that everything is connected and love is the foundation. Now it just feels like a nice memory.",
    "I don't think there's one specific thing. It's more like the mundane pressures of life just slowly eroded the insights. Work stress, relationship stuff, the usual.",
    "Actually, I do still meditate most mornings. And I've been journaling more. I think the foundations are there, I just expected more dramatic change.",
    "That's helpful to hear. Maybe I'm measuring integration wrong — looking for transformation when it's really about these small consistent practices.",
    "You're right. I think I need to be more compassionate with myself about the pace of change. The ceremony planted seeds; I need to trust the growing.",
    "Thank you. This conversation helped me shift from 'I'm failing at integration' to 'integration is happening, just not how I expected.' That's a big reframe.",
  ],
};

// =============================================================================
// EXPORTS
// =============================================================================

const ALL_PERSONAS = [
  ifsPersona,
  nervousSystemMappingPersona,
  journalPersona,
  coreBeliefsPersona,
  triggersGlimmersPersona,
  regulatingResourcesPersona,
  experienceMappingPersona,
  intentionPersona,
  therapeuticIntegrationPersona,
  activeImaginationPersona,
  generalPersona,
];

// Quick-run subset for faster testing
const QUICK_PERSONAS = [
  ifsPersona,
  journalPersona,
  generalPersona,
];

module.exports = {
  ALL_PERSONAS,
  QUICK_PERSONAS,
  // Individual exports for targeted testing
  ifsPersona,
  nervousSystemMappingPersona,
  journalPersona,
  coreBeliefsPersona,
  triggersGlimmersPersona,
  regulatingResourcesPersona,
  experienceMappingPersona,
  intentionPersona,
  therapeuticIntegrationPersona,
  activeImaginationPersona,
  generalPersona,
};
