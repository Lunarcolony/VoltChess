from django.core.management.base import BaseCommand

from sync.server_analysis import process_server_queue
from sync.services import release_stale_analysis_claims, sync_coach_student_link

from academies.models import CoachStudentLink


class Command(BaseCommand):
    help = "Sync platform games and process server-side analysis queue (for Pi cron)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--sync-only",
            action="store_true",
            help="(default behaviour) Only import games, skip server analysis",
        )
        parser.add_argument(
            "--analyze",
            action="store_true",
            help=(
                "Also run the server-side Stockfish analysis queue. Off by "
                "default: server-side analysis is single-PV and cannot produce "
                "the full report (accuracy / move classifications), and once a "
                "game has any eval the student's browser stops analyzing it. "
                "Prefer browser-side analysis for complete reports."
            ),
        )
        parser.add_argument(
            "--analyze-only",
            action="store_true",
            help="Only run server analysis queue (implies --analyze)",
        )
        parser.add_argument(
            "--max-analyze",
            type=int,
            default=3,
            help="Max games to analyze per run",
        )

    def handle(self, *args, **options):
        run_analysis = options["analyze"] or options["analyze_only"]
        released = release_stale_analysis_claims()
        if released:
            self.stdout.write(f"Released {released} stale analysis claim(s)")

        if not options["analyze_only"]:
            links = (
                CoachStudentLink.objects.filter(sync_enabled=True)
                .exclude(platform="")
                .exclude(platform_username="")
                .select_related("student")
            )
            for link in links:
                try:
                    result = sync_coach_student_link(link)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Synced {link.student.username} ({link.platform}/{link.platform_username}): {result}"
                        )
                    )
                except Exception as exc:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Sync failed {link.student.username}: {exc}"
                        )
                    )

        if run_analysis and not options["sync_only"]:
            result = process_server_queue(max_games=options["max_analyze"])
            self.stdout.write(self.style.SUCCESS(f"Server analysis: {result}"))
        elif not run_analysis:
            self.stdout.write(
                "Skipping server-side analysis (browser-authoritative). "
                "Pass --analyze to opt in."
            )
