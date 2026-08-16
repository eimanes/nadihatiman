import { site } from "@/content/site"
import { useHomeContent } from "@/components/HomeContentProvider"

/** Infinite horizontal marquee line under the hero. */
export default function Ticker() {
	const { content, language } = useHomeContent()
	return (
		<div
			aria-hidden="true"
			className="overflow-hidden whitespace-nowrap border-y border-line bg-paper py-4"
		>
			<div className="inline-flex animate-ticker">
				{[0, 1].map((i) => (
					<span key={i} className="pr-16 font-serif text-xl italic text-muted">
						{content[language].ticker} <i className="pl-16 not-italic text-gold">✦</i>
					</span>
				))}
			</div>
		</div>
	)
}
