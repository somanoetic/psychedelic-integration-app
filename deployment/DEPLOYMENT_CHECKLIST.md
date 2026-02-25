# FEAT-101 Deployment Checklist

**Feature:** FEAT-101: Session Day Checklist
**Date:** 2026-02-10
**Status:** Ready for Deployment
**Deployment Owner:** [Your Name]
**Deployment Date:** [To be filled]

---

## Pre-Deployment (24 Hours Before)

- [ ] **Review Documentation**
  - [ ] Read DEPLOYMENT_RUNBOOK.md completely
  - [ ] Review monitoring.yaml configuration
  - [ ] Review feature-flags.json
  - [ ] Review infrastructure.yaml
  - [ ] Understand rollback procedures

- [ ] **Team Preparation**
  - [ ] Brief entire team on deployment plan
  - [ ] Confirm on-call engineer availability
  - [ ] Schedule tech lead review
  - [ ] Verify no competing deployments scheduled
  - [ ] Send announcement to #deployment channel

- [ ] **Environment Verification**
  - [ ] Confirm staging environment is healthy
  - [ ] Verify no active incidents
  - [ ] Check all services are operational
  - [ ] Confirm database connectivity
  - [ ] Verify CI/CD pipeline is green

- [ ] **Code & Configuration Review**
  - [ ] All code merged to master/main
  - [ ] All tests passing in CI/CD
  - [ ] Migration files reviewed and approved
  - [ ] Edge function code reviewed
  - [ ] App configuration updated and tested
  - [ ] No API keys or secrets in code

- [ ] **Backup & Recovery**
  - [ ] Database backup procedure documented
  - [ ] Rollback scripts tested locally
  - [ ] Rollback runbook reviewed
  - [ ] Backup verification procedure documented
  - [ ] Team knows how to execute rollback

- [ ] **Monitoring Setup**
  - [ ] Dashboards created and tested
  - [ ] Alerts configured and tested
  - [ ] Log aggregation working
  - [ ] Metrics collection active
  - [ ] On-call notifications configured

---

## Pre-Deployment (2 Hours Before)

- [ ] **Final Verification**
  - [ ] Confirm no new commits pushing
  - [ ] Verify staging environment healthy
  - [ ] Check all systems status page
  - [ ] Confirm no competing deployments
  - [ ] Final team huddle/standup

- [ ] **Access & Credentials**
  - [ ] Verify Supabase CLI access
  - [ ] Confirm EAS CLI authentication
  - [ ] Verify GitHub CLI access
  - [ ] Test API key access
  - [ ] Confirm AWS/cloud access

- [ ] **Monitoring Active**
  - [ ] Start monitoring dashboard
  - [ ] Open log viewing tool
  - [ ] Prepare error tracking dashboard
  - [ ] Have metrics in view
  - [ ] Slack channel open for updates

- [ ] **Communication Channels**
  - [ ] Slack channel ready (#deployment or #feat-101)
  - [ ] Email notifications working
  - [ ] PagerDuty ready (if applicable)
  - [ ] Team on standby in channel

---

## Deployment Execution

### Phase 1: Validation (Estimated: 5 minutes)

- [ ] Execute validation checks
  - [ ] `supabase db validate`
  - [ ] `supabase functions validate claude-proxy`
  - [ ] Git secret scan complete
  - [ ] `git status` clean

- [ ] Log result:
  - Start time: __________
  - Duration: __________
  - Status: ☐ Success ☐ Failed

### Phase 2: Database Preparation (Estimated: 15 minutes)

- [ ] Pre-migration backup created
  - [ ] Backup ID: __________
  - [ ] Backup verified
  - [ ] Backup location confirmed

- [ ] Database connectivity verified
  - [ ] Connection successful
  - [ ] Database version correct
  - [ ] Current table count: __________

- [ ] Log result:
  - Start time: __________
  - Duration: __________
  - Status: ☐ Success ☐ Failed

### Phase 3: Database Migration (Estimated: 10-15 minutes)

- [ ] Migrations applied
  - [ ] `supabase db push` successful
  - [ ] No errors in output
  - [ ] Migration duration: __________

- [ ] Tables verified
  - [ ] session_checklists created: ☐ Yes ☐ No
  - [ ] session_checklist_items created: ☐ Yes ☐ No
  - [ ] checklist_template_items created: ☐ Yes ☐ No
  - [ ] user_rate_limits created: ☐ Yes ☐ No
  - [ ] api_usage_logs created: ☐ Yes ☐ No

- [ ] Indexes verified
  - [ ] idx_session_checklists_user_time: ☐ Yes ☐ No
  - [ ] idx_session_checklists_incomplete: ☐ Yes ☐ No
  - [ ] idx_session_checklist_items_session: ☐ Yes ☐ No
  - [ ] idx_session_checklist_items_is_custom: ☐ Yes ☐ No
  - [ ] idx_template_items_active_version: ☐ Yes ☐ No

- [ ] RLS policies verified
  - [ ] All tables have RLS enabled: ☐ Yes ☐ No
  - [ ] Policy count: ____ (expected: 12+)

- [ ] Seed data verified
  - [ ] Seed items count: ____ (expected: 18)
  - [ ] Categories represented: ☐ Yes ☐ No

- [ ] Log result:
  - Start time: __________
  - Duration: __________
  - Status: ☐ Success ☐ Failed ☐ Rollback Executed

### Phase 4: Edge Function Deployment (Estimated: 10-15 minutes)

- [ ] API key secret set
  - [ ] ANTHROPIC_API_KEY secret created: ☐ Yes ☐ No
  - [ ] Secret verified in `supabase secrets list`: ☐ Yes ☐ No

- [ ] Edge function deployed
  - [ ] `supabase functions deploy claude-proxy` successful
  - [ ] Deployment duration: __________

- [ ] Edge function tested
  - [ ] HTTP 200 or 401 response: ☐ Yes ☐ No
  - [ ] No 500 errors: ☐ Yes ☐ No
  - [ ] Response time: __________ ms

- [ ] Logs reviewed
  - [ ] No errors in function logs: ☐ Yes ☐ No
  - [ ] Function responding correctly: ☐ Yes ☐ No

- [ ] Log result:
  - Start time: __________
  - Duration: __________
  - Status: ☐ Success ☐ Failed ☐ Rollback Executed

### Phase 5: App Build & Deploy (Estimated: 30-45 minutes)

- [ ] Code verified
  - [ ] Git status clean: ☐ Yes ☐ No
  - [ ] Version updated: ☐ Yes ☐ No
  - [ ] All code committed: ☐ Yes ☐ No

- [ ] EAS build completed
  - [ ] iOS build successful: ☐ Yes ☐ No
  - [ ] Android build successful: ☐ Yes ☐ No
  - [ ] Build IDs: iOS: __________ Android: __________

- [ ] OTA update published
  - [ ] `eas update` successful: ☐ Yes ☐ No
  - [ ] Branch: staging
  - [ ] Update ID: __________

- [ ] Log result:
  - Start time: __________
  - Duration: __________
  - Status: ☐ Success ☐ Failed ☐ Rollback Executed

### Phase 6: Post-Deployment Verification (Estimated: 15-20 minutes)

- [ ] Error rate checked
  - [ ] Current error rate: _____% (expected: <1%)
  - [ ] Status: ☐ Acceptable ☐ Concerning ☐ Critical

- [ ] Response latency checked
  - [ ] P50: __________ ms (target: <200ms)
  - [ ] P95: __________ ms (target: <500ms)
  - [ ] P99: __________ ms (target: <1000ms)
  - [ ] Status: ☐ Acceptable ☐ Concerning ☐ Critical

- [ ] Database health verified
  - [ ] Connection count normal: ☐ Yes ☐ No
  - [ ] Lock wait time acceptable: ☐ Yes ☐ No
  - [ ] Query latency acceptable: ☐ Yes ☐ No

- [ ] RLS policies verified
  - [ ] No policy violations: ☐ Yes ☐ No
  - [ ] Violation count: __________ (expected: 0)

- [ ] Edge function verified
  - [ ] Function responding: ☐ Yes ☐ No
  - [ ] No 500 errors: ☐ Yes ☐ No
  - [ ] Rate limiting working: ☐ Yes ☐ No

- [ ] Manual end-to-end test
  - [ ] App loads successfully: ☐ Yes ☐ No
  - [ ] User can log in: ☐ Yes ☐ No
  - [ ] Can create session: ☐ Yes ☐ No
  - [ ] Checklist appears: ☐ Yes ☐ No
  - [ ] Can toggle items: ☐ Yes ☐ No
  - [ ] Can add custom items: ☐ Yes ☐ No
  - [ ] Data persists after restart: ☐ Yes ☐ No

- [ ] Database data verification
  - [ ] Checklists created: ☐ Yes ☐ No
  - [ ] Items toggled: ☐ Yes ☐ No
  - [ ] Custom items added: ☐ Yes ☐ No

- [ ] Log result:
  - Start time: __________
  - Duration: __________
  - Status: ☐ Success ☐ Failed ☐ Rollback Executed

### Phase 7: Enable Feature Flag

- [ ] Feature flag enabled
  - [ ] feat_101_session_checklist.enabled = true: ☐ Yes ☐ No
  - [ ] Configuration deployed: ☐ Yes ☐ No

- [ ] Initial rollout setting
  - [ ] Percentage: __________ % (start low, e.g., 10%)
  - [ ] Target users: ☐ Internal ☐ Beta ☐ All

- [ ] Log result:
  - Start time: __________
  - Duration: __________
  - Status: ☐ Success ☐ Failed

---

## Post-Deployment Monitoring

### First Hour (Critical)

- [ ] **Error Monitoring**
  - [ ] Check every 5 minutes
  - [ ] Alert threshold: >2% error rate
  - [ ] Current error rate: __________ % ✓ __________ %

- [ ] **Performance Monitoring**
  - [ ] Check every 5 minutes
  - [ ] P99 latency target: <1000ms
  - [ ] Current P99: __________ ms ✓ __________ ms

- [ ] **Infrastructure Health**
  - [ ] Database connections healthy: ☐ Yes ☐ No
  - [ ] Edge function responsive: ☐ Yes ☐ No
  - [ ] No critical alerts: ☐ Yes ☐ No

- [ ] **User Impact**
  - [ ] Monitor support channels: ☐ No issues ☐ Issues reported
  - [ ] User feedback: __________
  - [ ] Rollback decision: ☐ Continue ☐ Rollback

### First 24 Hours

- [ ] **Daily Monitoring Checklist**
  - [ ] Error rate stable (<1%): ☐ Yes ☐ No
  - [ ] Performance metrics normal: ☐ Yes ☐ No
  - [ ] Feature adoption metrics: __________
  - [ ] No new incident reports: ☐ Yes ☐ No
  - [ ] Database health good: ☐ Yes ☐ No

- [ ] **Business Metrics**
  - [ ] Checklists created: __________
  - [ ] Users engaged: __________
  - [ ] Custom items added: __________
  - [ ] Adoption rate: _____% (target: 10-20%)

---

## Rollback Decision Points

**ROLLBACK if:**

1. Error rate > 5% for > 5 minutes
   - [ ] Condition met: ☐ Yes ☐ No
   - [ ] Action taken: ☐ Continue ☐ Rollback

2. P99 latency > 5000ms for > 10 minutes
   - [ ] Condition met: ☐ Yes ☐ No
   - [ ] Action taken: ☐ Continue ☐ Rollback

3. Database unavailable for > 2 minutes
   - [ ] Condition met: ☐ Yes ☐ No
   - [ ] Action taken: ☐ Continue ☐ Rollback

4. Edge function down for > 3 minutes
   - [ ] Condition met: ☐ Yes ☐ No
   - [ ] Action taken: ☐ Continue ☐ Rollback

5. Data corruption detected
   - [ ] Condition met: ☐ Yes ☐ No
   - [ ] Action taken: ☐ Continue ☐ Rollback

6. Security violation detected
   - [ ] Condition met: ☐ Yes ☐ No
   - [ ] Action taken: ☐ Continue ☐ Rollback

**If rollback executed:**

- [ ] Rollback method: __________ (flag/database/app)
- [ ] Time to rollback: __________ minutes
- [ ] Verification complete: ☐ Yes ☐ No
- [ ] Systems stable: ☐ Yes ☐ No
- [ ] Post-mortem scheduled: ☐ Yes ☐ No

---

## Sign-Off

### Deployment Complete

- **Deployment Owner:** ____________________________
- **Deployment Date:** ____________________________
- **Deployment Time:** ____ to ____ (duration: ____ hours)
- **Final Status:** ☐ Successful ☐ Rollback ☐ Partial

### Approvals

- [ ] **Tech Lead Approval**
  - Name: ____________________________
  - Date: ____________________________
  - Signature: ____________________________

- [ ] **Engineering Manager Approval** (if applicable)
  - Name: ____________________________
  - Date: ____________________________
  - Signature: ____________________________

### Documentation

- [ ] **Post-Deployment Report**
  - [ ] Report written: ☐ Yes ☐ No
  - [ ] Metrics documented: ☐ Yes ☐ No
  - [ ] Issues documented: ☐ Yes ☐ No
  - [ ] Posted to #deployment: ☐ Yes ☐ No

- [ ] **Post-Mortem** (if needed)
  - [ ] Scheduled: ☐ Yes ☐ No
  - [ ] Date/time: ____________________________
  - [ ] Owner: ____________________________

- [ ] **Context System Updated**
  - [ ] Context files updated: ☐ Yes ☐ No
  - [ ] BUG-001 marked resolved: ☐ Yes ☐ No
  - [ ] BUG-002 marked resolved: ☐ Yes ☐ No
  - [ ] FEAT-101 marked complete: ☐ Yes ☐ No

---

## Final Notes

**Deployment Summary:**

________________________________________________________________________

________________________________________________________________________

________________________________________________________________________

**Issues Encountered:**

________________________________________________________________________

________________________________________________________________________

**Lessons Learned:**

________________________________________________________________________

________________________________________________________________________

**Next Steps:**

________________________________________________________________________

________________________________________________________________________

---

**Deployment Checklist Version:** 1.0
**Last Updated:** 2026-02-10
**Next Review:** After deployment completion
