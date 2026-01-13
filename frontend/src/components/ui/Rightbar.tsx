"use client";

import type { HTMLAttributes } from "react";
import { Card, CardBody, CardHeader } from "@/components/elements/Card";
import { Avatar } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Tag } from "@/components/elements/Tag";
import { Button } from "@/components/buttons/Button";
import { cx } from "@/lib/classNames";

const TASKS = [
  {
    id: "language",
    title: "Lezioni di inglese 20c",
    reward: "10 SCoins",
    accent: "accent" as const,
  },
  {
    id: "cooking",
    title: "Cucinare la pizza 15c",
    reward: "7 SCoins",
    accent: "warning" as const,
  },
];

const BOOKINGS = [
  {
    id: "hotel",
    title: "Dubai Hotel",
    date: "15.10 - 17.10",
    reward: "100 SCoins",
  },
  {
    id: "restaurant",
    title: "Sushi Restaurant",
    date: "20.10",
    reward: "20 SCoins",
  },
];

const MEMBERSHIP_BENEFITS = [
  "Gestisci abbonamento",
  "Passa a Syncro Pro",
  "Aggiungi SCoins",
];

export interface RightbarProps extends HTMLAttributes<HTMLElement> {
  position?: "fixed" | "absolute";
}

export const Rightbar = ({
  className,
  position = "fixed",
  ...props
}: RightbarProps) => (
  <aside
    className={cx(
      position,
      "right-4 top-4 bottom-4 z-30 w-[320px]",
      className
    )}
    {...props}
  >
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-[var(--radius-xl)] border border-border/70 bg-surface p-4 shadow-md">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name="Martin" size="xl" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Martin</p>
              <p className="text-xs text-subtle">Travel creator</p>
            </div>
            <Button size="sm" variant="secondary">
              Profilo
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent" size="sm">
              Match 94%
            </Badge>
            <Badge tone="success" size="sm">
              Online
            </Badge>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-foreground">
            I tuoi Syncro Task
          </h3>
        </CardHeader>
        <CardBody className="space-y-3">
          {TASKS.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2"
            >
              <div
                className={cx(
                  "flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-xs font-semibold",
                  task.accent === "accent"
                    ? "bg-accent-soft text-accent"
                    : "bg-warning/15 text-warning"
                )}
              >
                SC
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {task.title}
                </p>
                <p className="text-xs text-subtle">{task.reward}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-foreground">
            Le tue prenotazioni
          </h3>
        </CardHeader>
        <CardBody className="space-y-3">
          {BOOKINGS.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted text-xs font-semibold text-foreground">
                BK
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {booking.title}
                </p>
                <p className="text-xs text-subtle">{booking.date}</p>
              </div>
              <Badge tone="accent" size="sm">
                {booking.reward}
              </Badge>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-foreground">
            Il tuo abbonamento
          </h3>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Syncro Premium
              </p>
              <p className="text-xs text-subtle">Attivo fino al 15/12</p>
            </div>
            <Badge tone="accent" size="sm">
              Premium
            </Badge>
          </div>
          <ul className="space-y-2 text-xs text-subtle">
            {MEMBERSHIP_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                {benefit}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-foreground">Il tuo profilo</h3>
        </CardHeader>
        <CardBody className="flex items-center justify-between">
          <span className="text-xs text-subtle">Energia dominante</span>
          <Tag tone="accent">Solare</Tag>
        </CardBody>
      </Card>
    </div>
  </aside>
);
