# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class Trovyn(gl.Contract):
    item_kind: str
    lost_description: str
    found_description: str
    verdict: str
    confidence: u32
    reason: str
    comparison_count: u32
    submitter: Address

    def __init__(self):
        self.item_kind = ""
        self.lost_description = ""
        self.found_description = ""
        self.verdict = ""
        self.confidence = u32(0)
        self.reason = ""
        self.comparison_count = u32(0)
        self.submitter = Address("0x0000000000000000000000000000000000000000")

    @gl.public.view
    def get_latest(self) -> str:
        return (
            self.item_kind + "|" + self.verdict + "|" +
            str(int(self.confidence)) + "|" + self.reason
        )

    @gl.public.view
    def get_count(self) -> int:
        return int(self.comparison_count)

    @gl.public.write
    def compare_items(
        self,
        item_kind: str,
        lost_description: str,
        found_description: str,
    ) -> None:
        kind = item_kind.strip()
        lost = lost_description.strip()
        found = found_description.strip()

        if len(kind) < 2 or len(kind) > 40:
            raise gl.vm.UserError("Item type must be between 2 and 40 characters")
        if len(lost) < 25 or len(lost) > 500:
            raise gl.vm.UserError("Lost-item description must be 25-500 characters")
        if len(found) < 25 or len(found) > 500:
            raise gl.vm.UserError("Found-item description must be 25-500 characters")
        if "|" in kind or "|" in lost or "|" in found:
            raise gl.vm.UserError("The pipe character is not supported")

        def leader_fn():
            prompt = f"""
You are a careful lost-and-found matching adjudicator. Decide whether the two
descriptions likely refer to the same physical item.

Item type: {kind}
Lost report: {lost}
Found report: {found}

Prioritize distinctive details such as material, color combination, brand,
damage, engraving, contents, size, and location clues. Generic similarities are
not enough. Contradicting distinctive details should produce NO_MATCH. Do not
infer facts absent from the reports.

Return strict JSON using exactly this schema:
{{"match": true or false, "confidence": integer from 0 to 100,
  "reason": "one neutral sentence under 220 characters"}}
Never use the pipe character.
"""
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            proposed = leader_result.calldata
            try:
                if not isinstance(proposed["match"], bool):
                    return False
                proposed_confidence = int(proposed["confidence"])
                proposed_reason = proposed["reason"]
                if proposed_confidence < 0 or proposed_confidence > 100:
                    return False
                if not isinstance(proposed_reason, str):
                    return False
                if len(proposed_reason) < 15 or len(proposed_reason) > 220:
                    return False
                if "|" in proposed_reason:
                    return False

                own = leader_fn()
                own_confidence = int(own["confidence"])
                return (
                    own["match"] == proposed["match"] and
                    abs(own_confidence - proposed_confidence) <= 20
                )
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        self.item_kind = kind
        self.lost_description = lost
        self.found_description = found
        self.verdict = "MATCH" if result["match"] else "NO_MATCH"
        self.confidence = u32(max(0, min(100, int(result["confidence"]))))
        self.reason = result["reason"]
        self.comparison_count = self.comparison_count + u32(1)
        self.submitter = gl.message.sender_address
