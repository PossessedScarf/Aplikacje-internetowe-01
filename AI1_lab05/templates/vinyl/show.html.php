<?php

/** @var \App\Model\Vinyl $vinyl */
/** @var \App\Service\Router $router */

$title = "{$vinyl->getTitle()} ({$vinyl->getId()})";
$bodyClass = 'show';

ob_start(); ?>
    <h1><?= $vinyl->getTitle() ?></h1>
    <h4> Price: <?= $vinyl->getPrice() ?></h4>
    <article>
        <?= $vinyl->getDescription();?>
    </article>

    <ul class="action-list">
        <li> <a href="<?= $router->generatePath('vinyl-index') ?>">Back to list</a></li>
        <li><a href="<?= $router->generatePath('vinyl-edit', ['id'=> $vinyl->getId()]) ?>">Edit</a></li>
    </ul>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';
