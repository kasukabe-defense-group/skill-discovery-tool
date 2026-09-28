import Link from "next/link";

export const metadata = {
  title: "How to write a good skill — Skill Discovery Tool",
};

export default function HowToWriteAGoodSkillPage() {
  return (
    <main className="page">
      <Link className="back-link" href="/">
        &larr; Back
      </Link>
      <h1>How to write a good skill</h1>
      <p className="subtitle">
        A skill is a set of written instructions an AI tool reads before
        doing a task. It is not code. It is closer to a short manual for one
        job, written so the AI does that job the same way every time.
      </p>

      <div className="detail-block">
        <h2>What a skill needs</h2>
        <p>
          A name, a plain description of what it does, and clear steps for
          how to do it. The description matters most: it is what tells the
          AI when to use the skill at all.
        </p>
      </div>

      <div className="detail-block">
        <h2>Say exactly when to use it</h2>
        <p>
          &quot;Use this for writing&quot; is too broad. &quot;Use this when
          rewriting a draft that reads stiff or generic&quot; tells the AI
          something it can actually check against.
        </p>
      </div>

      <div className="detail-block">
        <h2>Give real examples</h2>
        <p>
          Show a before and an after, or a right way and a wrong way. A
          skill with one worked example is more useful than a skill with
          five vague rules.
        </p>
      </div>

      <div className="detail-block">
        <h2>Keep it to one job</h2>
        <p>
          A skill that tries to do five things becomes hard to trigger
          correctly and hard to trust. Split it into smaller skills instead.
        </p>
      </div>
    </main>
  );
}
