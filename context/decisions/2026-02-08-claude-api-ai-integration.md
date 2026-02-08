# ADR-004: Use Claude API for AI Features

**Date:** 2026-02-08 (Retrospective - original decision ~2023)
**Status:** Accepted
**Deciders:** Project Lead

---

## Context

The app's core value proposition involves AI-assisted integration support:
- Conversational journaling prompts
- Intention-setting guidance
- Nervous system assessment interpretation
- Core beliefs exploration
- Psychoeducational responses
- Personalized support and reflection

**Requirements:**
- High-quality, empathetic, nuanced responses
- Context-aware conversations (not just Q&A)
- Safe, supportive tone (trauma-informed)
- Streaming responses for better UX
- Privacy-respecting (sensitive mental health data)
- Cost-effective for bootstrap budget
- Developer-friendly API

**Critical Context:**
- Psychedelic integration is sensitive domain
- Users may be processing trauma
- Tone matters as much as content
- Need long-context conversations
- Privacy is paramount (no training on user data)

---

## Decision

Use **Anthropic Claude API** (Sonnet model primarily) for all AI-powered features:

**API:** `@anthropic-ai/sdk` v0.60.0
**Primary Model:** Claude 3.5 Sonnet (claude-sonnet-3-5-20240620)
**Integration Pattern:** Multiple specialized AI services

### Specialized AI Services:
- `lib/claudeService.js` - General AI service
- `lib/enhancedClaudeService.js` - Context-aware conversations
- `lib/dailyJournalAIService.js` - Journal prompts
- `lib/nervousSystemMappingAIService.js` - Polyvagal assessment
- `lib/coreBeliefsAIService.js` - Core beliefs exploration
- `lib/conversationalRoutingService.js` - Intent routing
- Additional services for specific features

---

## Rationale

### Why Claude (vs. GPT/Gemini):
1. **Constitutional AI**: Trained to be helpful, harmless, honest
   - Critical for mental health/trauma context
   - Naturally supportive and non-judgmental tone
   - Less likely to give harmful advice

2. **Long Context Windows**: 200K tokens (Claude 3.5 Sonnet)
   - Can include full conversation history
   - Context-aware responses
   - Better for ongoing integration support

3. **Privacy Commitment**:
   - Anthropic doesn't train on API data by default
   - Critical for sensitive psychedelic integration content
   - User trust essential

4. **Streaming Support**:
   - Responses stream token-by-token
   - Better UX (no long waits)
   - Feels more conversational

5. **Quality of Responses**:
   - Nuanced understanding of complex topics
   - Empathetic tone without being patronizing
   - Good at following complex system prompts
   - Excellent for therapeutic/supportive contexts

6. **Developer Experience**:
   - Clean API design
   - Excellent documentation
   - TypeScript support
   - Reliable uptime

### Why This Fits Our Use Case:
- **Safety-first**: Constitutional AI aligned with therapeutic context
- **Context-aware**: Long context for personalized guidance
- **Privacy**: No training on user data
- **Quality**: Responses feel supportive and human
- **Reliable**: Good uptime, predictable behavior

---

## Consequences

### Positive ✅
- Excellent response quality for therapeutic contexts
- Users report feeling "understood" by AI guidance
- Streaming creates engaging conversational feel
- Long context enables truly personalized support
- Privacy commitment builds user trust
- API reliability has been excellent
- Easy to create specialized AI services

### Negative ⚠️
- **Cost**: $3-15 per million tokens (adds up with conversations)
- **API dependency**: If Anthropic has outage, AI features down
- **Rate limits**: Need to handle API errors gracefully
- **Latency**: Streaming still takes seconds to start
- **No fine-tuning**: Can't customize model weights (only prompts)
- **Context window costs**: Long conversations = expensive tokens

### Neutral ℹ️
- Need careful prompt engineering for each feature
- Responses can vary (not deterministic)
- Need robust error handling for API failures
- Monitoring API costs important
- Caching strategies needed for repeated content

---

## Alternatives Considered

### Option 1: OpenAI GPT-4
**Pros**: Very capable, huge ecosystem, function calling, cheaper at time
**Cons**: Less focused on safety/harm reduction, trains on API data (privacy concern), shorter context
**Why not chosen**: Privacy concerns for sensitive content; Claude's constitutional AI better fit for therapeutic context

### Option 2: Google Gemini
**Pros**: Multimodal, very long context, competitive pricing
**Cons**: Newer (less proven), unclear privacy policy, less therapeutic tone
**Why not chosen**: Claude more proven for safety-critical applications; Gemini less mature at decision time

### Option 3: Open Source Models (Llama, Mistral, etc.)
**Pros**: Full control, no API costs, can fine-tune, data stays local
**Cons**: Need to host/manage infrastructure, smaller context windows, quality inconsistent, expensive GPU hosting
**Why not chosen**: Solo dev can't maintain ML infrastructure; quality not comparable for therapeutic use

### Option 4: Multiple Providers (GPT for some, Claude for others)
**Pros**: Use best tool for each job
**Cons**: More complexity, need to manage multiple APIs, inconsistent UX
**Why not chosen**: Consistency important for user experience; simpler to master one provider

### Option 5: No AI (Human-written content only)
**Pros**: No API costs, full control, no dependencies
**Cons**: Can't personalize, static content less engaging, no conversational support
**Why not chosen**: AI-assisted integration is core value proposition

---

## Implementation Notes

### API Integration:
```javascript
// Streaming response example
const stream = await anthropic.messages.stream({
  model: 'claude-sonnet-3-5-20240620',
  max_tokens: 1024,
  messages: conversationHistory,
  system: systemPrompt
});

for await (const chunk of stream) {
  // Stream to UI in real-time
}
```

### Cost Management:
- Use Sonnet (not Opus) for most features ($3/MTok vs $15/MTok)
- Implement conversation summarization for long histories
- Cache system prompts when possible
- Monitor per-user usage to detect abuse
- Set max token limits per request

### Error Handling:
- Fallback to cached responses if API down
- Graceful degradation (show static content)
- Retry logic with exponential backoff
- User-friendly error messages

### Prompt Engineering:
- System prompts stored in service files
- Context-specific instructions for each feature
- Few-shot examples for consistent formatting
- Trauma-informed language guidelines
- Clear boundaries (not therapy, not medical advice)

### Security:
- API key in `.env` (not committed)
- ⚠️ Key was exposed in git history (BUG-001, now fixed)
- ✅ Key rotated 2026-02-07
- Monitor for unusual usage patterns

---

## Security Incident (2026-02-07)

**Issue:** Anthropic API key committed to git history (BUG-001)
**Impact:** Key potentially exposed publicly
**Resolution:**
- ✅ Added `.env` to `.gitignore`
- ✅ Created `.env.example` template
- ✅ Rotated API key with new one
- ✅ Verified new key working
- ✅ Documented in SECURITY_INCIDENT_2026-02-07.md

**Lesson:** Never commit API keys; use environment variables from day 1.

---

## Cost Analysis

**Current Usage (estimated):**
- ~500 conversations per month
- Average 20 turns per conversation
- ~500 tokens per response
- Total: ~5M tokens/month

**Monthly Cost:**
- Sonnet: 5M tokens × $3/MTok = $15/month
- Acceptable for early stage
- Will need optimization at scale

**Optimization Strategies:**
- Cache frequent prompts
- Summarize long conversations
- Use Haiku for simple tasks ($0.25/MTok)
- Implement user quotas if needed

---

## Future Considerations

### If We Outgrow Claude:
1. **Hybrid approach**: Use Claude for sensitive, GPT for simple
2. **Self-hosted**: Llama 3 or similar (if quality improves)
3. **Fine-tuning**: Train specialized model on integration data
4. **RAG system**: Combine smaller model + knowledge base

### When to Reconsider:
- Cost exceeds $200/month consistently
- Privacy requirements change (need on-device)
- Better models emerge (e.g., open source breakthrough)
- Need offline functionality

**Migration difficulty:** Medium (prompts portable, but responses may differ)

---

## References

- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [Constitutional AI Paper](https://arxiv.org/abs/2212.08073)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- Project: `lib/claudeService.js` and other AI services
- Security Incident: `SECURITY_INCIDENT_2026-02-07.md`
- Prompt examples: `lib/*AIService.js` files

---

## Review

**Works Well:**
- ✅ Response quality excellent for therapeutic contexts
- ✅ Users feel supported and understood
- ✅ Streaming UX feels natural
- ✅ Long context enables personalized guidance
- ✅ Privacy commitment important for user trust
- ✅ API reliability has been excellent (99.9%+ uptime)

**Challenges:**
- ⚠️ Cost adds up with heavy usage
- ⚠️ Prompt engineering takes iteration
- ⚠️ Responses sometimes too verbose
- ⚠️ Need better conversation summarization
- ⚠️ API errors need better UX handling

**Would Choose Again:** ✅ Absolutely
For a mental health/integration app, Claude's safety-first approach and quality are worth the cost. The Constitutional AI training is particularly well-suited for therapeutic contexts.

**Key Strength:** Claude's empathetic, non-judgmental tone is perfect for psychedelic integration support.

**Next Review:** 2026-06-01 (after 6 months of production use)

---

**Status:** Accepted and Validated
**Production Since:** 2025-10 (estimate)
**Current Model:** Claude 3.5 Sonnet (claude-sonnet-3-5-20240620)
**Monthly Cost:** ~$15-30 (varies with usage)
